import PodcastEpisodesBoard from '@/components/admin/PodcastEpisodesBoard'
import { getAllPodcastEpisodes } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminPodcastPage() {
  let episodes: Awaited<ReturnType<typeof getAllPodcastEpisodes>>

  try {
    episodes = await getAllPodcastEpisodes()
  } catch {
    episodes = []
  }

  return <PodcastEpisodesBoard initialEpisodes={episodes} />
}
