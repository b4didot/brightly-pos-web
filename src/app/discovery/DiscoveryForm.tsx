"use client";

import { useActionState, useRef, useState } from "react";
import { submitDiscoveryForm, type DiscoveryFormState } from "./actions";

const initialState: DiscoveryFormState = {
  ok: false,
  message: "",
};

const featureOptions = [
  ["offline", "Works offline"],
  ["fast_checkout", "Fast checkout"],
  ["staff_management", "Easy staff management & tracking"],
  ["sales_reports", "Detailed sales reports"],
  ["multiple_payments", "Multiple payment methods"],
  ["discounts", "Custom discounts & promotions"],
  ["backup_recovery", "Backup & recovery"],
  ["cloud_dashboard", "Cloud dashboard"],
  ["tax_calculations", "Tax calculations"],
  ["other", "Other"],
] as const;

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-semibold text-stone-900">
      {children}
      {required ? <span className="text-amber-700"> *</span> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-2 h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-base text-stone-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="mt-2 h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-base text-stone-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="mt-2 min-h-28 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
    />
  );
}

function Option({
  children,
  name,
  value,
  type = "radio",
  required,
  disabled,
  onChange,
}: {
  children: React.ReactNode;
  name: string;
  value: string;
  type?: "radio" | "checkbox";
  required?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800 transition has-[:checked]:border-amber-700 has-[:checked]:bg-amber-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45">
      <input
        className="h-4 w-4 accent-amber-700"
        disabled={disabled}
        name={name}
        onChange={onChange}
        required={required}
        type={type}
        value={value}
      />
      <span>{children}</span>
    </label>
  );
}

export function DiscoveryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [usesPos, setUsesPos] = useState("");
  const totalRequiredQuestions = 19;
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const [state, formAction, pending] = useActionState(
    async (
      prevState: DiscoveryFormState,
      formData: FormData,
    ): Promise<DiscoveryFormState> => {
      const nextState = await submitDiscoveryForm(prevState, formData);

      if (nextState.ok) {
        formRef.current?.reset();
        setUsesPos("");
        setAnsweredQuestions(0);
      }

      return nextState;
    },
    initialState,
  );

  function updateProgress() {
    const form = formRef.current;

    if (!form) {
      return 0;
    }

    const data = new FormData(form);
    const keys = [
      "owner_name",
      "shop_name",
      "shop_type",
      "staff_count",
      "daily_transactions",
      "order_type",
      "uses_pos",
      "biggest_frustration",
      "internet_downtime",
      "internet_outage_handling",
      "needed_reports",
      "staff_tracking_importance",
      "device_backup_importance",
      "testing_commitment",
      "email",
    ];
    const singles = keys.filter((key) => String(data.get(key) || "").length > 0);
    const featureGroup = data.getAll("important_features").length > 0 ? 1 : 0;
    const contactGroup = data.getAll("contact_methods").length > 0 ? 1 : 0;

    setAnsweredQuestions(
      Math.min(totalRequiredQuestions, singles.length + featureGroup + contactGroup),
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-8"
      onChange={updateProgress}
    >
      <div>
        <div className="flex items-center justify-between gap-4 text-sm font-medium text-stone-600">
          <span>Question {answeredQuestions} of {totalRequiredQuestions}</span>
          <span>{Math.round((answeredQuestions / totalRequiredQuestions) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-amber-700 transition-all"
            style={{
              width: `${(answeredQuestions / totalRequiredQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-stone-950">Contact Info</h2>
        <div>
          <FieldLabel required>Owner Name</FieldLabel>
          <TextInput name="owner_name" required type="text" />
        </div>
        <div>
          <FieldLabel required>Shop Name</FieldLabel>
          <TextInput name="shop_name" required type="text" />
        </div>
        <div>
          <FieldLabel required>Shop Type</FieldLabel>
          <div className="mt-2 grid gap-2">
            <Option name="shop_type" required value="cafe">Coffee Shop / Cafe</Option>
            <Option name="shop_type" value="qsr">Quick Service Restaurant</Option>
            <Option name="shop_type" value="other">Other</Option>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-stone-950">Current Operations</h2>
        <div>
          <FieldLabel required>How many staff members do you have?</FieldLabel>
          <SelectInput name="staff_count" required defaultValue="">
            <option value="" disabled>Select staff count</option>
            <option value="1-2">1-2 (just you)</option>
            <option value="3-5">3-5</option>
            <option value="6-10">6-10</option>
            <option value="10+">10+</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel required>Average daily transactions?</FieldLabel>
          <SelectInput name="daily_transactions" required defaultValue="">
            <option value="" disabled>Select range</option>
            <option value="20-100">20-100</option>
            <option value="100-200">100-200</option>
            <option value="200+">200+</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel required>Do you offer dine-in, takeout, or both?</FieldLabel>
          <div className="mt-2 grid gap-2">
            <Option name="order_type" required value="dine_in">Dine-in only</Option>
            <Option name="order_type" value="takeout">Takeout only</Option>
            <Option name="order_type" value="both">Both</Option>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-stone-950">Current POS & Pain Points</h2>
        <div>
          <FieldLabel required>Do you currently use a POS system?</FieldLabel>
          <div className="mt-2 grid gap-2">
            <Option name="uses_pos" required value="no" onChange={(event) => setUsesPos(event.currentTarget.value)}>No</Option>
            <Option name="uses_pos" value="yes_unhappy" onChange={(event) => setUsesPos(event.currentTarget.value)}>Yes, but unhappy with it</Option>
            <Option name="uses_pos" value="yes_happy" onChange={(event) => setUsesPos(event.currentTarget.value)}>Yes, happy with it</Option>
          </div>
        </div>
        {usesPos.startsWith("yes") ? (
          <div>
            <FieldLabel>If yes, which POS do you use?</FieldLabel>
            <TextInput name="current_pos_name" type="text" />
          </div>
        ) : null}
        <div>
          <FieldLabel required>What&apos;s your biggest frustration with your current setup?</FieldLabel>
          <TextArea
            name="biggest_frustration"
            placeholder="Slow checkout, internet dependency, expensive fees, hard to track staff, etc."
            required
          />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-stone-950">Specific Needs</h2>
        <div>
          <FieldLabel required>How often does your internet go down?</FieldLabel>
          <SelectInput name="internet_downtime" required defaultValue="">
            <option value="" disabled>Select frequency</option>
            <option value="never">Never</option>
            <option value="rarely">Rarely</option>
            <option value="sometimes">Sometimes</option>
            <option value="often">Often</option>
            <option value="frequently">Frequently</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel required>When internet goes down, what happens?</FieldLabel>
          <div className="mt-2 grid gap-2">
            <Option name="internet_outage_handling" required value="lose_sales">We lose sales completely</Option>
            <Option name="internet_outage_handling" value="manual_backup">We use manual backup</Option>
            <Option name="internet_outage_handling" value="never_happens">It never happens</Option>
            <Option name="internet_outage_handling" value="not_sure">We&apos;re not sure</Option>
          </div>
        </div>
        <div>
          <FieldLabel required>Which features are most important?</FieldLabel>
          <div className="mt-2 grid gap-2">
            {featureOptions.map(([value, label]) => (
              <Option
                key={value}
                name="important_features"
                type="checkbox"
                value={value}
              >
                {label}
              </Option>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel required>What reports or data would help you run your shop better?</FieldLabel>
          <TextArea
            name="needed_reports"
            placeholder="Sales by time of day, sales by staff member, inventory tracking, profit margins, etc."
            required
          />
        </div>
        <div>
          <FieldLabel required>Do you need to track which staff member made each transaction?</FieldLabel>
          <div className="mt-2 grid gap-2">
            <Option name="staff_tracking_importance" required value="not_important">No, not important</Option>
            <Option name="staff_tracking_importance" value="nice_to_have">Nice to have</Option>
            <Option name="staff_tracking_importance" value="critical">Critical</Option>
          </div>
        </div>
        <div>
          <FieldLabel required>How important is having a backup if your device fails or gets stolen?</FieldLabel>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Option key={value} name="device_backup_importance" required={value === 1} value={String(value)}>
                {value}
              </Option>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-stone-950">Commitment & Contact</h2>
        <div>
          <FieldLabel required>How committed are you to testing a new POS for 2-3 months?</FieldLabel>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Option key={value} name="testing_commitment" required={value === 1} value={String(value)}>
                {value}
              </Option>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel required>Best way to contact you?</FieldLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Option name="contact_methods" type="checkbox" value="email">Email</Option>
            <Option name="contact_methods" type="checkbox" value="phone">Phone</Option>
            <Option name="contact_methods" type="checkbox" value="whatsapp">WhatsApp</Option>
          </div>
        </div>
        <div>
          <FieldLabel required>Email address</FieldLabel>
          <TextInput name="email" required type="email" />
        </div>
        <div>
          <FieldLabel>Phone number</FieldLabel>
          <TextInput name="phone_number" type="tel" />
        </div>
        <div>
          <FieldLabel>Anything else you want us to know?</FieldLabel>
          <TextArea name="additional_notes" />
        </div>
      </section>

      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            state.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="h-14 w-full rounded-md bg-amber-700 px-6 text-base font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
