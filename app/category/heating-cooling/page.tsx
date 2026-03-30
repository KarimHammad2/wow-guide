"use client"

import { Header } from "@/components/guide/header"
import { Footer } from "@/components/guide/footer"
import { InfoCard } from "@/components/guide/info-card"
import { InstructionStepper } from "@/components/guide/instruction-stepper"
import { AlertBox } from "@/components/guide/alert-box"
import { FAQAccordion } from "@/components/guide/faq-accordion"
import { RelatedCategories } from "@/components/guide/related-categories"
import { NeedHelpCard } from "@/components/guide/need-help-card"
import { 
  Thermometer, 
  Snowflake, 
  Sun,
  Gauge
} from "lucide-react"

export default function HeatingCoolingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Thermometer className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Heating & Cooling
            </h1>
            <p className="text-muted-foreground">
              Your apartment features underfloor heating and air conditioning for year-round comfort.
            </p>
          </div>

          {/* Temperature Display */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recommended Temperature</p>
                <p className="text-4xl font-bold text-foreground">21°C</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center">
                <Gauge className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              For optimal comfort and energy efficiency, we recommend keeping your apartment between 19-22°C.
            </p>
          </div>

          {/* Heating Mode */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Sun className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Heating Mode</h2>
          </div>

          <InfoCard
            title="Underfloor Heating"
            description="Your apartment has electric underfloor heating controlled by a thermostat in the hallway. Please note it can take 30-60 minutes to reach your desired temperature."
            className="mb-6"
          />

          <InstructionStepper
            steps={[
              {
                title: "Locate the thermostat",
                description: "Find the Heatmiser thermostat on the hallway wall"
              },
              {
                title: "Set your temperature",
                description: "Use the up/down arrows to set between 18-24°C"
              },
              {
                title: "Check the schedule",
                description: "The system runs 6am-10pm by default to save energy"
              },
              {
                title: "Wait for warmth",
                description: "Underfloor heating takes time - be patient!"
              }
            ]}
            className="mb-8"
          />

          {/* Cooling Mode */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Cooling Mode</h2>
          </div>

          <InfoCard
            title="Air Conditioning"
            description="During warmer months, use the air conditioning unit located in the living area. The remote control is in the welcome pack."
            className="mb-6"
          />

          <InstructionStepper
            steps={[
              {
                title: "Point the remote at the unit",
                description: "The AC unit is mounted high on the wall"
              },
              {
                title: "Press the power button",
                description: "Wait for the beep to confirm it's on"
              },
              {
                title: "Set to Cool mode",
                description: "Press Mode until you see the snowflake icon"
              },
              {
                title: "Adjust temperature",
                description: "We recommend 22-24°C for comfort"
              }
            ]}
            className="mb-8"
          />

          <AlertBox
            type="info"
            title="Energy Saving Tip"
            message="Please turn off heating and AC when opening windows. Close curtains during hot afternoons to keep the apartment cool naturally."
            className="mb-8"
          />

          <AlertBox
            type="warning"
            title="Before You Leave"
            message="Please set the heating to 15°C (frost protection) and turn off the AC when checking out."
            className="mb-8"
          />

          {/* FAQs */}
          <FAQAccordion
            items={[
              {
                question: "The heating isn't working?",
                answer: "First check the thermostat is set above the current room temperature and the schedule is active. Underfloor heating takes 30-60 minutes to warm up. If still not working after 2 hours, contact us."
              },
              {
                question: "The AC remote isn't responding?",
                answer: "Try replacing the batteries (spare AAAs in the kitchen drawer). Point directly at the unit from within 5 meters. If still not working, use the manual button on the unit itself."
              },
              {
                question: "Can I adjust the heating schedule?",
                answer: "Yes! Press the clock button on the thermostat to enter schedule mode. You can set different temperatures for different times of day."
              },
              {
                question: "Is there a maximum temperature?",
                answer: "The heating is limited to 24°C to ensure energy efficiency and prevent overheating. The AC can be set as low as 16°C."
              }
            ]}
            className="mb-8"
          />

          <RelatedCategories
            categories={[
              { name: "Internet & TV", slug: "internet-tv" },
              { name: "Appliances", slug: "appliances" },
              { name: "Emergency", slug: "emergency" }
            ]}
            className="mb-8"
          />

          <NeedHelpCard />
        </div>
      </main>

      <Footer />
    </div>
  )
}
