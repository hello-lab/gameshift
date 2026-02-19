import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get("gs_session")?.value;
    if (!token) return false;
    
    const session = verifySession(token);
    if (!session) return false;

    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.sub),
    });

    return user?.isAdmin || false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const settings = db.collection("settings");
    
    let gameSetting = await settings.findOne({ key: "currentGamePhase" });
    
    if (!gameSetting) {
      // Initialize with default phase
      const defaultSetting = {
        key: "currentGamePhase",
        phase: "battleship",
        updatedAt: new Date(),
      };
      await settings.insertOne(defaultSetting);
      return NextResponse.json({ 
        phase: "battleship",
        battleshipEnabled: true,
        wordleEnabled: false,
      });
    }

    return NextResponse.json({ 
      phase: gameSetting.phase || "battleship",
      battleshipEnabled: (gameSetting.phase || "battleship") === "battleship",
      wordleEnabled: (gameSetting.phase || "battleship") === "wordle",
    });
  } catch (error) {
    console.error("Error fetching game phase:", error);
    return NextResponse.json({ error: "Failed to fetch game phase" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check auth first using request.cookies
  const isAdmin = await checkAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read body after auth check
    const body = await request.json();
    const phase = body?.phase;
    
    if (!phase) {
      return NextResponse.json(
        { error: "Phase is required" },
        { status: 400 }
      );
    }
    
    if (!["battleship", "wordle"].includes(phase)) {
      return NextResponse.json(
        { error: "Invalid phase" },
        { status: 400 }
      );
    }

    // Update database
    const db = await getDb();
    const settings = db.collection("settings");
    
    await settings.updateOne(
      { key: "currentGamePhase" },
      {
        $set: {
          key: "currentGamePhase",
          phase,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      phase,
      battleshipEnabled: phase === "battleship",
      wordleEnabled: phase === "wordle",
    });
  } catch (error) {
    console.error("Error updating game phase:", error);
    return NextResponse.json(
      { error: "Failed to update game phase" },
      { status: 500 }
    );
  }
}
