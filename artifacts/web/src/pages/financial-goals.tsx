import { useState } from "react";
import { ArrowLeft, Calculator, LockKeyhole, RotateCcw, Target } from "lucide-react";
import { Link } from "wouter";
import {
  calculatePrivateFinancialGoalMonthlyAmount,
  formatPrivateWorksheetCurrency,
  PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE,
  PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE,
} from "@/features/financial-goals/privateFinancialGoalMath";

const GOAL_OPTIONS = [
  { value: "car", label: "Save for a car" },
  { value: "home-item", label: "Save for a home item" },
  { value: "education", label: "Save for education or training" },
  { value: "emergency", label: "Build a savings cushion" },
  { value: "other", label: "Another savings goal" },
] as const;

const emptyWorksheet = {
  goal: "car",
  targetAmount: "",
  deadline: "",
  currentSavedAmount: "",
};

export default function FinancialGoals() {
  const [worksheet, setWorksheet] = useState(emptyWorksheet);
  const calculation = calculatePrivateFinancialGoalMonthlyAmount(worksheet);

  return (
    <div className="min-h-screen bg-[#FAF6EF] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8D5C17] underline decoration-[#CA922B]/50 underline-offset-4 hover:text-[#CA922B]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Resources
        </Link>

        <header className="mt-6 rounded-3xl bg-[#2B1507] px-6 py-8 text-white shadow-sm md:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CA922B]/20">
              <Target className="h-6 w-6 text-[#CA922B]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#CA922B]">Private worksheet</p>
              <h1 className="mt-2 font-serif text-3xl font-bold">Financial Goals</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F5EBD8]/80">
                Try simple planning math for a goal such as saving for a car. Every field is optional, and you decide what to enter.
              </p>
            </div>
          </div>
        </header>

        <section aria-label="Privacy and educational notice" className="mt-5 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#8D5C17]" aria-hidden="true" />
            <div className="space-y-2 text-sm leading-6 text-[#3A1F0E]/80">
              <p className="font-semibold text-[#2B1507]">Private to this browser session</p>
              <p>{PRIVATE_FINANCIAL_GOAL_PRIVACY_NOTICE}</p>
              <p>{PRIVATE_FINANCIAL_GOAL_EDUCATION_NOTICE}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="financial-goal-worksheet-title" className="mt-6 rounded-3xl border border-[#E8D9C0] bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="financial-goal-worksheet-title" className="font-serif text-2xl font-bold text-[#2B1507]">Your optional worksheet</h2>
              <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/65">Enter only the details you want to use for this on-page estimate.</p>
            </div>
            <button
              type="button"
              onClick={() => setWorksheet(emptyWorksheet)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3A1F0E]/15 px-3 py-2 text-xs font-semibold text-[#3A1F0E]/70 transition-colors hover:border-[#CA922B]/45 hover:text-[#8D5C17]"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Clear worksheet
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2" htmlFor="private-financial-goal-type">
              <span className="block text-sm font-semibold text-[#2B1507]">What are you saving for?</span>
              <select
                id="private-financial-goal-type"
                value={worksheet.goal}
                onChange={(event) => setWorksheet((current) => ({ ...current, goal: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-[#7B6048]/40 bg-white px-3 py-3 text-sm text-[#2B1507] outline-none focus:ring-2 focus:ring-[#CA922B]/45"
              >
                {GOAL_OPTIONS.map((goal) => <option key={goal.value} value={goal.value}>{goal.label}</option>)}
              </select>
            </label>

            <label htmlFor="private-financial-goal-target">
              <span className="block text-sm font-semibold text-[#2B1507]">Target amount <span className="font-normal text-[#3A1F0E]/55">(optional)</span></span>
              <input
                id="private-financial-goal-target"
                value={worksheet.targetAmount}
                onChange={(event) => setWorksheet((current) => ({ ...current, targetAmount: event.target.value }))}
                inputMode="decimal"
                autoComplete="off"
                aria-describedby="private-financial-goal-target-help private-financial-goal-target-error"
                aria-invalid={Boolean(calculation.errors.targetAmount)}
                placeholder="For example: 8000"
                className="mt-2 w-full rounded-xl border border-[#7B6048]/40 bg-white px-3 py-3 text-sm text-[#2B1507] outline-none focus:ring-2 focus:ring-[#CA922B]/45 aria-[invalid=true]:border-red-600"
              />
              <span id="private-financial-goal-target-help" className="mt-1 block text-xs text-[#3A1F0E]/55">Use numbers only. This page does not store the amount.</span>
              {calculation.errors.targetAmount && <span id="private-financial-goal-target-error" role="alert" className="mt-1 block text-xs font-medium text-red-700">{calculation.errors.targetAmount}</span>}
            </label>

            <label htmlFor="private-financial-goal-current">
              <span className="block text-sm font-semibold text-[#2B1507]">Current saved amount <span className="font-normal text-[#3A1F0E]/55">(optional)</span></span>
              <input
                id="private-financial-goal-current"
                value={worksheet.currentSavedAmount}
                onChange={(event) => setWorksheet((current) => ({ ...current, currentSavedAmount: event.target.value }))}
                inputMode="decimal"
                autoComplete="off"
                aria-describedby="private-financial-goal-current-help private-financial-goal-current-error"
                aria-invalid={Boolean(calculation.errors.currentSavedAmount)}
                placeholder="For example: 500"
                className="mt-2 w-full rounded-xl border border-[#7B6048]/40 bg-white px-3 py-3 text-sm text-[#2B1507] outline-none focus:ring-2 focus:ring-[#CA922B]/45 aria-[invalid=true]:border-red-600"
              />
              <span id="private-financial-goal-current-help" className="mt-1 block text-xs text-[#3A1F0E]/55">Leave blank if you do not want to include it.</span>
              {calculation.errors.currentSavedAmount && <span id="private-financial-goal-current-error" role="alert" className="mt-1 block text-xs font-medium text-red-700">{calculation.errors.currentSavedAmount}</span>}
            </label>

            <label className="md:col-span-2" htmlFor="private-financial-goal-deadline">
              <span className="block text-sm font-semibold text-[#2B1507]">Deadline <span className="font-normal text-[#3A1F0E]/55">(optional)</span></span>
              <input
                id="private-financial-goal-deadline"
                type="date"
                value={worksheet.deadline}
                onChange={(event) => setWorksheet((current) => ({ ...current, deadline: event.target.value }))}
                aria-describedby="private-financial-goal-deadline-help private-financial-goal-deadline-error"
                aria-invalid={Boolean(calculation.errors.deadline)}
                className="mt-2 w-full rounded-xl border border-[#7B6048]/40 bg-white px-3 py-3 text-sm text-[#2B1507] outline-none focus:ring-2 focus:ring-[#CA922B]/45 aria-[invalid=true]:border-red-600"
              />
              <span id="private-financial-goal-deadline-help" className="mt-1 block text-xs text-[#3A1F0E]/55">A future date is needed only for the monthly estimate.</span>
              {calculation.errors.deadline && <span id="private-financial-goal-deadline-error" role="alert" className="mt-1 block text-xs font-medium text-red-700">{calculation.errors.deadline}</span>}
            </label>
          </div>

          <div aria-live="polite" className="mt-7 rounded-2xl border border-[#CA922B]/25 bg-[#FFF8EC] p-5">
            <div className="flex items-start gap-3">
              <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-[#8D5C17]" aria-hidden="true" />
              {calculation.kind === "complete" ? (
                <div>
                  <h3 className="font-semibold text-[#2B1507]">Simple monthly worksheet amount</h3>
                  <p className="mt-1 text-2xl font-bold text-[#8D5C17]">{formatPrivateWorksheetCurrency(calculation.monthlyAmount)} per month</p>
                  <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/70">
                    This divides {formatPrivateWorksheetCurrency(calculation.remainingAmount)} remaining by {calculation.months} month{calculation.months === 1 ? "" : "s"}. It is a simple estimate, not a recommendation or a promise.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-[#2B1507]">No monthly amount yet</h3>
                  <p className="mt-1 text-sm leading-6 text-[#3A1F0E]/70">{calculation.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="financial-goal-next-steps-title" className="mt-6 rounded-3xl border border-[#E8D9C0] bg-white p-5 shadow-sm md:p-7">
          <h2 id="financial-goal-next-steps-title" className="font-serif text-2xl font-bold text-[#2B1507]">General educational next steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#3A1F0E]/75">
            <li>Use the estimate as one way to compare a goal, target, and timeline you chose for yourself.</li>
            <li>Revisit the voluntary inputs when your own plans change; a different target or date will change the simple math.</li>
            <li>If you want advice tailored to your situation, consider consulting a qualified professional of your choosing.</li>
          </ol>
          <p className="mt-5 rounded-xl bg-[#FAF6EF] p-4 text-xs leading-5 text-[#3A1F0E]/60">
            This worksheet does not ask for, infer, or use income, debt, credit score, race, ethnicity, gender, family status, or other personal financial circumstances. It does not direct you to open credit or other accounts.
          </p>
        </section>
      </div>
    </div>
  );
}
