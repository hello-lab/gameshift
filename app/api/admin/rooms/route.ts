import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function requireAdmin(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get("gs_session")?.value;
  
  if (!token) {
    console.error("No session token found");
    return null;
  }

  const session = verifySession(token);

  if (!session) {
    console.error("Invalid session token");
    return null;
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(session.sub),
  });
  return user;
  if (!user) {
    console.error("User not found:", session.sub);
    return null;
  }

  if (!user.isAdmin) {
    console.error("User is not admin:", session.sub);
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Proxy to backend server
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const response = await fetch(`${backendUrl}/api/admin/rooms`, {
      headers: {
        "x-admin-user": admin._id.toString(),
      },
    });
console.log(response)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const response = await fetch(`${backendUrl}/api/admin/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-user": admin._id.toString(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || "Failed to create room" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
