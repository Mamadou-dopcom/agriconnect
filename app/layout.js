import { Inter, Sora } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata = {
  title: 'AgriConnect — De la ferme à votre table 🌾',
  description: 'Plateforme qui connecte directement les agriculteurs sénégalais aux acheteurs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${sora.variable} font-inter bg-gray-50`}>
        <Providers>
          {children}
          <Toaster position="top-center" toastOptions={{
            style: { fontFamily: 'var(--font-inter)', borderRadius: '12px' }
          }} />
        </Providers>
      </body>
    </html>
  )
}
