import { Toaster } from 'react-hot-toast'

const AppToaster = () => (
  <Toaster
    position="top-right"
    reverseOrder={false}
    gutter={8}
    containerStyle={{ top: '1.5rem', right: '1.5rem', zIndex: 120 }}
    toastOptions={{ duration: 4000, style: { background: 'transparent', boxShadow: 'none', padding: 0 } }}
  />
)

export default AppToaster
