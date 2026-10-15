const { chromium } = require('playwright-core')
const WEB = 'http://localhost:5180'
let pass = 0, fail = 0
const check = (name, ok, extra = '') => { ok ? (pass++, console.log(`  ok   ${name}`)) : (fail++, console.log(`  FAIL ${name} ${extra}`)) }

const signIn = async (page, email, password, home) => {
  await page.goto(`${WEB}/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`**${home}`)
}

const run = async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  const tpoCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } })
  const stuCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } })
  const tpo = await tpoCtx.newPage()
  const student = await stuCtx.newPage()
  const errors = []
  tpo.on('pageerror', (e) => errors.push(`tpo: ${e.message}`))
  student.on('pageerror', (e) => errors.push(`student: ${e.message}`))

  await signIn(tpo, 'tpo@campus.test', 'tpo@1234', '/tpo/calendar')
  await signIn(student, 'student@campus.test', 'student@1234', '/student/calendar')
  check('tpo portal open', tpo.url().includes('/tpo/calendar'))
  check('student portal open', student.url().includes('/student/calendar'))
  check('sidebar has Campus Calendar', await tpo.getByRole('link', { name: 'Campus Calendar' }).first().isVisible())
  await student.getByRole('button', { name: /Notifications/ }).waitFor()
  check('student header has bell', true)

  await tpo.getByRole('button', { name: 'New Event' }).click()
  const drawer = tpo.locator('[role="dialog"]').filter({ hasText: 'Create New Event' }).first()
  check('no red error before publish', (await drawer.getByText(/is required\./).count()) === 0)

  await drawer.getByRole('button', { name: /Publish Event/ }).click()
  check('errors appear after publish click', (await drawer.getByText('Title is required.').count()) > 0)

  await drawer.getByRole('button', { name: /Pre-Placement Talk/ }).click()
  await tpo.getByText('Deadline', { exact: true }).last().click()
  await tpo.waitForTimeout(300)
  check('deadline hides time fields', (await drawer.getByText('Start Time').count()) === 0)

  const title = `Live Deadline ${Date.now().toString().slice(-5)}`
  await drawer.getByLabel(/Event Title/).fill(title)

  const future = new Date(Date.now() + 8 * 86400000)
  await drawer.locator('button:has-text("Select date")').first().click()
  await tpo
    .locator('[data-radix-popper-content-wrapper] button')
    .filter({ hasText: new RegExp(`^${future.getDate()}$`) })
    .first()
    .click()

  await drawer.getByRole('button', { name: 'Select courses' }).click()
  await tpo.getByText('BTech', { exact: true }).last().click()
  await tpo.keyboard.press('Escape')
  await drawer.getByRole('button', { name: 'Select batches' }).click()
  await tpo.getByText('2027 (Final year)', { exact: true }).last().click()
  await tpo.keyboard.press('Escape')
  await drawer.getByRole('button', { name: 'Select departments' }).click()
  await tpo.getByText('Computer Science', { exact: true }).last().click()
  await tpo.keyboard.press('Escape')

  const countText = await drawer.getByText(/students will be notified/).first().textContent()
  check('live count shown', /\d+ students will be notified/.test(countText || ''), countText || '')

  await drawer.getByRole('button', { name: /Publish Event/ }).click()
  await tpo.getByText(/Event published\./).waitFor({ timeout: 10000 })
  check('tpo sees publish toast', true)
  check('event on tpo calendar', await tpo.getByText(title).first().isVisible())

  await student.waitForTimeout(2500)
  check('student calendar updated without reload', (await student.getByText(title).count()) > 0)
  const bellLabel = await student.getByRole('button', { name: /Notifications/ }).getAttribute('aria-label')
  check('student bell shows unread', /unread/.test(bellLabel || ''), bellLabel || '')

  await student.getByRole('button', { name: /Notifications/ }).click()
  check('notification text', (await student.getByText(new RegExp(`New event: ${title}`)).count()) > 0)
  await student.getByText(new RegExp(`New event: ${title}`)).click()
  await student.waitForTimeout(600)
  check('clicking notification opens the drawer', (await student.locator('[role="dialog"]').last().getByText(title).count()) > 0)

  check('no page errors', errors.length === 0, errors.join(' | '))
  await browser.close()
  console.log(`\n${pass} pass, ${fail} fail`)
  process.exit(fail ? 1 : 0)
}
run().catch((e) => { console.error(e.message); process.exit(1) })
