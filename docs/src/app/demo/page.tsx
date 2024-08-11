import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo | Suggest Feature',
}
export default function Page() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-12">
        <h1 className="scroll-m-20 text-4xl font-extrabold text-center tracking-tight lg:text-6xl dark:text-white">
          Demo
        </h1>
        <div className="space-y-8 lg:grid lg:grid-cols-2 sm:gap-6 xl:gap-10 lg:space-y-0 mt-8">
          <Card >
            <CardHeader>
              <CardTitle>Widget</CardTitle>
              <CardDescription>Place where the customers can access the roadmap and feature page</CardDescription>
            </CardHeader>
            <CardContent>
              Widget
            </CardContent>
            <CardFooter>
              Widget Page Footer
            </CardFooter>
          </Card>
          <Card >
            <CardHeader>
              <CardTitle>Admin page</CardTitle>
              <CardDescription>Where you can control, approve, and manage pages and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              Portal
            </CardContent>
            <CardFooter>
              Admin Page Footer
            </CardFooter>
          </Card>

        </div>
      </div>
    </section >
  )
}
