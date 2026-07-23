import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "지원하지 않는 이미지 형식입니다." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지 크기는 5MB 이하여야 합니다." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignore if exists
    }

    const ext = file.type.split('/')[1]
    const filename = `${userId}-${crypto.randomBytes(8).toString('hex')}.${ext}`
    const filepath = join(uploadDir, filename)
    
    // Save to disk
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/avatars/${filename}`

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { image: publicUrl }
    })

    return NextResponse.json({ success: true, imageUrl: publicUrl })
  } catch (error: any) {
    console.error("Image Upload API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
