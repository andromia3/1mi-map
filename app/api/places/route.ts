import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { normalizePlace, type Place } from "@/lib/types"

const createPlaceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const normalizedPlaces = places.map(place => normalizePlace(place as Place))
    return NextResponse.json(normalizedPlaces)
  } catch (error) {
    console.error("Get places error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { title, description, lat, lng } = createPlaceSchema.parse(body)

    const place = await prisma.place.create({
      data: {
        title,
        description,
        lat,
        lng,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    const normalizedPlace = normalizePlace(place as Place)
    return NextResponse.json(normalizedPlace, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    console.error("Create place error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
