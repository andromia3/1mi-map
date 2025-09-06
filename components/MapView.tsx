"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { type NormalizedUser, type NormalizedPlace } from "@/lib/types"

const addPlaceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
})

type AddPlaceFormData = z.infer<typeof addPlaceSchema>

interface MapViewProps {
  user: NormalizedUser
}

export default function MapView({ user }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [places, setPlaces] = useState<NormalizedPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPlace, setShowAddPlace] = useState(false)
  const [clickedLngLat, setClickedLngLat] = useState<[number, number] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddPlaceFormData>({
    resolver: zodResolver(addPlaceSchema),
  })

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-0.1276, 51.5072], // London
      zoom: 11,
    })

    map.current.on("load", () => {
      setIsLoading(false)
    })

    map.current.on("click", (e) => {
      setClickedLngLat([e.lngLat.lng, e.lngLat.lat])
      setShowAddPlace(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Load places
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const response = await fetch("/api/places")
        if (response.ok) {
          const placesData = await response.json()
          setPlaces(placesData)
        }
      } catch (err) {
        console.error("Failed to load places:", err)
      }
    }

    loadPlaces()
  }, [])

  // Add markers to map
  useEffect(() => {
    if (!map.current || places.length === 0) return

    // Clear existing markers
    const existingMarkers = document.querySelectorAll(".map-marker")
    existingMarkers.forEach(marker => marker.remove())

    places.forEach((place) => {
      const el = document.createElement("div")
      el.className = "map-marker"
      el.style.width = "20px"
      el.style.height = "20px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#22c55e"
      el.style.border = "2px solid white"
      el.style.cursor = "pointer"
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)"

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${place.title}</h3>
          ${place.description ? `<p class="text-xs text-gray-600 mt-1">${place.description}</p>` : ""}
          <p class="text-xs text-gray-500 mt-2">Added by ${place.createdBy.displayName || place.createdBy.username}</p>
        </div>
      `)

      new mapboxgl.Marker(el)
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map.current!)
    })
  }, [places])

  const onSubmitPlace = async (data: AddPlaceFormData) => {
    if (!clickedLngLat) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          lat: clickedLngLat[1],
          lng: clickedLngLat[0],
        }),
      })

      if (response.ok) {
        const newPlace = await response.json()
        setPlaces(prev => [newPlace, ...prev])
        setShowAddPlace(false)
        setClickedLngLat(null)
        reset()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add place")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAddPlace = () => {
    setShowAddPlace(false)
    setClickedLngLat(null)
    reset()
    setError("")
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen">
      <div ref={mapContainer} className="h-full w-full" />
      
      {showAddPlace && clickedLngLat && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Nice Place</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseAddPlace}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Add a place at {clickedLngLat[1].toFixed(4)}, {clickedLngLat[0].toFixed(4)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitPlace)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter place title"
                    {...register("title")}
                    disabled={isSubmitting}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter place description"
                    {...register("description")}
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAddPlace}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Adding..." : "Add Place"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
