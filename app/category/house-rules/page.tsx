"use client"

import { Header } from "@/components/guide/header"
import { Footer } from "@/components/guide/footer"
import { AlertBox } from "@/components/guide/alert-box"
import { FAQAccordion } from "@/components/guide/faq-accordion"
import { RelatedCategories } from "@/components/guide/related-categories"
import { NeedHelpCard } from "@/components/guide/need-help-card"
import { 
  ScrollText, 
  Volume2, 
  CigaretteOff, 
  Users,
  Clock,
  PawPrint,
  PartyPopper,
  Camera
} from "lucide-react"

const rules = [
  {
    icon: Volume2,
    title: "Quiet Hours",
    description: "Please keep noise to a minimum between 10pm and 8am out of respect for neighbours.",
    color: "bg-blue-500/10 text-blue-600"
  },
  {
    icon: CigaretteOff,
    title: "No Smoking",
    description: "This is a strictly non-smoking property. This includes vaping and e-cigarettes. A £250 deep cleaning fee applies for violations.",
    color: "bg-red-500/10 text-red-600"
  },
  {
    icon: Users,
    title: "Maximum Occupancy",
    description: "The apartment is licensed for a maximum of 2 guests. Additional guests are not permitted to stay overnight.",
    color: "bg-purple-500/10 text-purple-600"
  },
  {
    icon: PartyPopper,
    title: "No Parties or Events",
    description: "Parties, gatherings, and events are strictly prohibited. This is a residential building.",
    color: "bg-orange-500/10 text-orange-600"
  },
  {
    icon: PawPrint,
    title: "No Pets",
    description: "Unfortunately we cannot accommodate pets. Service animals may be permitted with prior arrangement.",
    color: "bg-green-500/10 text-green-600"
  },
  {
    icon: Camera,
    title: "Security Cameras",
    description: "CCTV operates in communal areas of the building for your security. There are no cameras inside apartments.",
    color: "bg-gray-500/10 text-gray-600"
  },
]

export default function HouseRulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <ScrollText className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              House Rules
            </h1>
            <p className="text-muted-foreground">
              To ensure a comfortable stay for all our guests, please observe these simple rules.
            </p>
          </div>

          {/* Check In/Out Times */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-foreground">Check-In & Check-Out Times</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card">
                <p className="text-sm text-muted-foreground mb-1">Check-In</p>
                <p className="text-2xl font-bold text-foreground">3:00 PM</p>
                <p className="text-xs text-muted-foreground">or later</p>
              </div>
              <div className="p-4 rounded-xl bg-card">
                <p className="text-sm text-muted-foreground mb-1">Check-Out</p>
                <p className="text-2xl font-bold text-foreground">11:00 AM</p>
                <p className="text-xs text-muted-foreground">or earlier</p>
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-4 mb-8">
            {rules.map((rule, index) => (
              <div key={index} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.color}`}>
                    <rule.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{rule.title}</h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <AlertBox
            type="info"
            title="Respectful Living"
            message="Our apartments are in residential buildings. Please be mindful of your neighbours and treat the property as you would your own home."
            className="mb-8"
          />

          <AlertBox
            type="warning"
            title="Breach of Rules"
            message="Serious breaches may result in immediate termination of your stay without refund. Damage or additional cleaning costs will be charged to your card on file."
            className="mb-8"
          />

          {/* FAQs */}
          <FAQAccordion
            items={[
              {
                question: "Can I have visitors during my stay?",
                answer: "Day visitors are welcome, but overnight guests beyond the registered occupants are not permitted. Please ensure visitors leave by 10pm to respect quiet hours."
              },
              {
                question: "Is early check-in or late check-out available?",
                answer: "Subject to availability, early check-in (from 1pm) or late check-out (until 2pm) may be arranged for an additional fee. Please contact us at least 48 hours in advance."
              },
              {
                question: "What happens if I accidentally damage something?",
                answer: "Accidents happen! Please let us know immediately so we can assess and resolve the issue. Minor wear and tear is expected, but significant damage will be charged."
              },
              {
                question: "Can I receive packages at the apartment?",
                answer: "Yes, packages can be delivered to the building. Please use your full name and apartment number. The concierge can accept packages during their hours (8am-8pm)."
              }
            ]}
            className="mb-8"
          />

          <RelatedCategories
            categories={[
              { name: "Check In/Out", slug: "check-in-out" },
              { name: "Emergency", slug: "emergency" },
              { name: "Cleaning", slug: "cleaning" }
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
