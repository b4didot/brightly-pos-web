import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createOwnerToken } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LoginRequest = {
  username?: unknown;
  password?: unknown;
};

function requiredString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function POST(request: Request) {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = requiredString(body.username);
  const password = requiredString(body.password);

  if (!username || !password) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 400 },
    );
  }

  const { data: user, error } = await supabaseAdmin
    .from("cloud_users")
    .select("id, shop_id, username, password_hash, role, is_active")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  if (!user.is_active) {
    return NextResponse.json(
      { error: "User account is disabled" },
      { status: 403 },
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const { data: shop, error: shopError } = await supabaseAdmin
    .from("shops")
    .select("id, name, slug")
    .eq("id", user.shop_id)
    .maybeSingle();

  if (shopError || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const token = await createOwnerToken({
    userId: user.id,
    shopId: user.shop_id,
    username: user.username,
    role: user.role,
  });

  const response = NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
    },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
