"use server";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type DiscoveryFormState = {
  ok: boolean;
  message: string;
};

function readRequiredText(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Please fill out all required fields.");
  }

  return value.trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readScale(value: string, fieldName: string) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    throw new Error(`${fieldName} must be between 1 and 5.`);
  }

  return parsed;
}

function firstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export async function submitDiscoveryForm(
  _prevState: DiscoveryFormState,
  formData: FormData,
): Promise<DiscoveryFormState> {
  try {
    const importantFeatures = formData
      .getAll("important_features")
      .filter((value): value is string => typeof value === "string");
    const contactMethods = formData
      .getAll("contact_methods")
      .filter((value): value is string => typeof value === "string");

    if (importantFeatures.length === 0) {
      throw new Error("Please choose at least one important feature.");
    }

    if (contactMethods.length === 0) {
      throw new Error("Please choose at least one contact method.");
    }

    const headerList = await headers();
    const payload = {
      owner_name: readRequiredText(formData, "owner_name"),
      shop_name: readRequiredText(formData, "shop_name"),
      shop_type: readRequiredText(formData, "shop_type"),
      staff_count: readRequiredText(formData, "staff_count"),
      daily_transactions: readRequiredText(formData, "daily_transactions"),
      order_type: readRequiredText(formData, "order_type"),
      uses_pos: readRequiredText(formData, "uses_pos"),
      current_pos_name: readOptionalText(formData, "current_pos_name"),
      biggest_frustration: readRequiredText(formData, "biggest_frustration"),
      internet_downtime: readRequiredText(formData, "internet_downtime"),
      internet_outage_handling: readRequiredText(
        formData,
        "internet_outage_handling",
      ),
      important_features: JSON.stringify(importantFeatures),
      needed_reports: readRequiredText(formData, "needed_reports"),
      staff_tracking_importance: readRequiredText(
        formData,
        "staff_tracking_importance",
      ),
      device_backup_importance: readScale(
        readRequiredText(formData, "device_backup_importance"),
        "Device backup importance",
      ),
      testing_commitment: readScale(
        readRequiredText(formData, "testing_commitment"),
        "Testing commitment",
      ),
      contact_methods: JSON.stringify(contactMethods),
      email: readRequiredText(formData, "email"),
      phone_number: readOptionalText(formData, "phone_number"),
      additional_notes: readOptionalText(formData, "additional_notes"),
      ip_address: firstForwardedIp(
        headerList.get("x-forwarded-for") ?? headerList.get("x-real-ip"),
      ),
      user_agent: headerList.get("user-agent"),
    };

    const { error } = await supabaseAdmin
      .from("pilot_discovery_responses")
      .insert(payload);

    if (error) {
      return {
        ok: false,
        message: "We could not save your response. Please try again.",
      };
    }

    return {
      ok: true,
      message: "Thanks for your feedback! We'll be in touch within 24 hours.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Please review the form and try again.",
    };
  }
}
