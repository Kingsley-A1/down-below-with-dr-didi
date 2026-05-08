import TeamMembersBoard from '@/components/admin/TeamMembersBoard'
import { getAllTeamMembers } from '@/lib/admin/repository'

export const dynamic = 'force-dynamic'

export default async function AdminTeamPage() {
  let members: Awaited<ReturnType<typeof getAllTeamMembers>>
  try {
    members = await getAllTeamMembers()
  } catch {
    members = []
  }

  return <TeamMembersBoard initialMembers={members} />
}
