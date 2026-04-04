"use client"

import { Header } from "@/components/guide/header"
import { InfoCard } from "@/components/guide/info-card"
import { InstructionStepper } from "@/components/guide/instruction-stepper"
import { FAQAccordion } from "@/components/guide/faq-accordion"
import { RelatedCategories } from "@/components/guide/related-categories"
import { NeedHelpCard } from "@/components/guide/need-help-card"
import { ManualCard } from "@/components/guide/manual-card"
import { 
  Refrigerator, 
  CookingPot, 
  Wind, 
  Microwave,
  Waves,
  Coffee
} from "lucide-react"

export default function AppliancesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <CookingPot className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Kitchen Appliances
            </h1>
            <p className="text-muted-foreground">
              Your apartment comes fully equipped with modern kitchen appliances. Here&apos;s how to use them.
            </p>
          </div>

          {/* Appliance Quick Reference */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: Refrigerator, label: "Refrigerator", temp: "4°C" },
              { icon: CookingPot, label: "Induction Hob", temp: "Touch control" },
              { icon: Microwave, label: "Microwave", temp: "800W" },
              { icon: Wind, label: "Extractor Fan", temp: "Auto mode" },
              { icon: Waves, label: "Dishwasher", temp: "Eco cycle" },
              { icon: Coffee, label: "Coffee Machine", temp: "Nespresso" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.temp}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Induction Hob */}
          <InfoCard
            title="Induction Hob"
            description="Your apartment features a modern induction hob with touch controls. Use only induction-compatible cookware."
            className="mb-6"
          />

          <InstructionStepper
            steps={[
              {
                title: "Place pan on zone",
                description: "Ensure your pan is centered on the cooking zone"
              },
              {
                title: "Touch the power symbol",
                description: "The hob will activate and show the control panel"
              },
              {
                title: "Select heat level",
                description: "Use + and - to adjust from 1-9 (or use boost)"
              },
              {
                title: "Turn off after use",
                description: "Touch the power symbol again to turn off"
              }
            ]}
            className="mb-8"
          />

          {/* Dishwasher */}
          <InfoCard
            title="Dishwasher"
            description="The Bosch dishwasher is located under the counter. We recommend using the Eco 50° program for everyday use."
            className="mb-6"
          />

          <InstructionStepper
            steps={[
              {
                title: "Load dishes properly",
                description: "Plates in bottom rack, glasses and cups on top"
              },
              {
                title: "Add detergent",
                description: "Place tablet in the dispenser compartment"
              },
              {
                title: "Select program",
                description: "Press the Eco button for standard washing"
              },
              {
                title: "Start cycle",
                description: "Press Start and close the door firmly"
              }
            ]}
            className="mb-8"
          />

          {/* Coffee Machine */}
          <InfoCard
            title="Nespresso Coffee Machine"
            description="Enjoy fresh coffee with your Nespresso machine. Compatible capsules can be purchased at local supermarkets."
            variant="highlight"
            className="mb-6"
          />

          <InstructionStepper
            steps={[
              {
                title: "Fill water tank",
                description: "Remove and fill with fresh water"
              },
              {
                title: "Insert capsule",
                description: "Lift lever, insert capsule, and close"
              },
              {
                title: "Place cup",
                description: "Position your cup under the spout"
              },
              {
                title: "Press button",
                description: "Small cup for espresso, large for lungo"
              }
            ]}
            className="mb-8"
          />

          {/* Manuals */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Appliance Manuals
            </h3>
            <div className="space-y-3">
              <ManualCard
                title="Bosch Induction Hob Manual"
                subtitle="Touch control operation guide"
                href="#"
              />
              <ManualCard
                title="Bosch Dishwasher Manual"
                subtitle="Program guide and maintenance"
                href="#"
              />
              <ManualCard
                title="Nespresso User Guide"
                subtitle="Machine care and descaling"
                href="#"
              />
            </div>
          </div>

          {/* FAQs */}
          <FAQAccordion
            items={[
              {
                question: "The induction hob won't turn on?",
                answer: "Ensure you're using induction-compatible cookware (magnetic). The pan must be centered on the zone. If the issue persists, check the circuit breaker in the utility cupboard."
              },
              {
                question: "How do I clean the induction hob?",
                answer: "Wait until the surface is cool, then wipe with a damp cloth and mild detergent. For stubborn marks, use a ceramic hob cleaner."
              },
              {
                question: "Where can I buy Nespresso pods?",
                answer: "Nespresso pods are available at major supermarkets like Waitrose and Sainsbury's, or order online from nespresso.com for next-day delivery."
              },
              {
                question: "The dishwasher isn't cleaning properly?",
                answer: "Ensure dishes aren't blocking the spray arms. Check the filter at the bottom for debris. Make sure you're using the correct amount of detergent."
              }
            ]}
            className="mb-8"
          />

          <RelatedCategories
            categories={[
              { name: "Cleaning", slug: "cleaning" },
              { name: "Waste & Recycling", slug: "waste-plan" },
              { name: "Check Out", slug: "check-in-out" }
            ]}
            className="mb-8"
          />

          <NeedHelpCard />
        </div>
      </main>
    </div>
  )
}
