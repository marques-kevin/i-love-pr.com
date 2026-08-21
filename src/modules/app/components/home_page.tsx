import { Settings } from '@/modules/settings'
import { HomeHeader } from './home_header'
import { RepoGallery } from './repo_gallery'

export function HomePage() {
  return (
    <>
      <HomeHeader />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
        <RepoGallery />
      </main>
      <Settings />
    </>
  )
}
