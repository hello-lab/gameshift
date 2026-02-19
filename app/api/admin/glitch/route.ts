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

const GLITCH_PHASES = [1, 2, 3, 4, 5];
const GLITCH_NAMES = [
  "Normal",
  "Reflective Armor (hit damages attacker)",
  "Dual Damage (hit damages both)",
  "Shot Shift (randomly shift coordinates)",
  "Double or Nothing (2x score)",
];

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const settings = db.collection("settings");

    let glitchSetting = await settings.findOne({ key: "currentGlitchPhase" });

    if (!glitchSetting) {
      // Initialize with default glitch phase
      const defaultSetting = {
        key: "currentGlitchPhase",
        phase: 1,
        updatedAt: new Date(),
      };
      await settings.insertOne(defaultSetting);
      return NextResponse.json({
        phase: 1,
        name: GLITCH_NAMES[0],
        availablePhases: GLITCH_PHASES.map((p) => ({
          phase: p,
          name: GLITCH_NAMES[p - 1],
        })),
      });
    }

    const phase = glitchSetting.phase || 1;
    return NextResponse.json({
      phase,
      name: GLITCH_NAMES[phase - 1],
      availablePhases: GLITCH_PHASES.map((p) => ({
        phase: p,
        name: GLITCH_NAMES[p - 1],
      })),
    });
  } catch (error) {
    console.error("Error fetching glitch phase:", error);
    return NextResponse.json(
      { error: "Failed to fetch glitch phase" },
      { status: 500 }
    );
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
    
    if (!GLITCH_PHASES.includes(phase)) {
      return NextResponse.json(
        { error: `Invalid glitch phase. Must be one of: ${GLITCH_PHASES.join(", ")}` },
        { status: 400 }
      );
    }

    // Update database
    const db = await getDb();
    const settings = db.collection("settings");

    await settings.updateOne(
      { key: "currentGlitchPhase" },
      {
        $set: {
          key: "currentGlitchPhase",
          phase,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      phase,
      name: GLITCH_NAMES[phase - 1],
    });
  } catch (error) {
    console.error("Error updating glitch phase:", error);
    return NextResponse.json(
      { error: "Failed to update glitch phase" },
      { status: 500 }
    );
  }
}
