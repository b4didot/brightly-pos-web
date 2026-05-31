import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashActivationToken } from "@/lib/token";

type DeviceAuthSuccess = {
  device: {
    id: string;
    shop_id: string;
    status: string | null;
    activation_token_id: string | null;
  };
};

type DeviceAuthResult =
  | DeviceAuthSuccess
  | {
      response: NextResponse;
    };

export type OwnerSession = {
  userId: string;
  shopId: string;
  username: string;
  role: string;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  return new TextEncoder().encode(secret);
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function verifyDeviceAuth(
  request: Request,
  shopId: string,
  deviceId: string,
): Promise<DeviceAuthResult> {
  const bearerToken = getBearerToken(request);

  if (!bearerToken) {
    return {
      response: NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 },
      ),
    };
  }

  const tokenHash = hashActivationToken(bearerToken);
  const { data: activationToken, error: tokenError } = await supabaseAdmin
    .from("activation_tokens")
    .select("id, shop_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError) {
    return {
      response: NextResponse.json(
        { error: "Authorization lookup failed" },
        { status: 500 },
      ),
    };
  }

  if (!activationToken || activationToken.shop_id !== shopId) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from("devices")
    .select("id, shop_id, status, activation_token_id")
    .eq("id", deviceId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (deviceError) {
    return {
      response: NextResponse.json(
        { error: "Device lookup failed" },
        { status: 500 },
      ),
    };
  }

  if (
    !device ||
    device.activation_token_id !== activationToken.id ||
    device.status !== "active"
  ) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return { device };
}

export async function createOwnerToken(session: OwnerSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(jwtSecret());
}

export async function verifyOwnerRequest(
  request: Request,
): Promise<OwnerSession | null> {
  const bearerToken = getBearerToken(request);

  if (!bearerToken) {
    return null;
  }

  const verified = await jwtVerify(bearerToken, jwtSecret(), {
    algorithms: ["HS256"],
  });

  const payload = verified.payload;

  if (
    typeof payload.userId !== "string" ||
    typeof payload.shopId !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.role !== "string"
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    shopId: payload.shopId,
    username: payload.username,
    role: payload.role,
  };
}
