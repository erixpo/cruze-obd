import { SessionProvider } from './session/AppSession'
import { AppShell } from './ui/AppShell'

export default function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  )
}
