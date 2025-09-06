import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import MapView from "@/components/MapView"
import Topbar from "@/components/Topbar"

export default async function MapPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <>
      <Topbar displayName={user.displayName || user.username} />
      <MapView user={user} />
    </>
  )
}
