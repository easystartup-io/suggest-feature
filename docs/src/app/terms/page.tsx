import Terms from '@/markdown/terms.mdx'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Suggest Feature',
}
export default function Page() {
  return (
    <div>
      <Terms />
    </div>
  )
}
