import { Metadata } from 'next';
import { Award, Shield, Truck, RefreshCw, Heart, Star, Users, Gem, Leaf, HeadphonesIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Lumin | Premium Jewelry Bangladesh',
  description: 'Discover the story behind Lumin — Bangladesh\'s premier online jewelry destination. Learn about our commitment to quality, craftsmanship, and customer satisfaction.',
  openGraph: {
    title: 'About Lumin | Premium Jewelry Bangladesh',
    description: 'Discover the story behind Lumin — Bangladesh\'s premier online jewelry destination.',
  },
};

// ── Stat Item ────────────────────────────────────────────────
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6 rounded-xl border" style={{ borderColor: 'rgba(201,169,110,0.15)' }}>
      <div className="text-2xl md:text-3xl font-bold" style={{ color: '#c9a96e', fontFamily: 'Georgia, serif' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: '#5a7070' }}>{label}</div>
    </div>
  );
}

// ── Value Card ───────────────────────────────────────────────
function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border transition-all duration-200 hover:-translate-y-1" style={{ borderColor: 'rgba(201,169,110,0.12)', backgroundColor: 'rgba(10,26,27,0.5)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
        <div style={{ color: '#c9a96e' }}>{icon}</div>
      </div>
      <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#f0ebe0' }}>{title}</h3>
      <p className="text-xs leading-relaxed" style={{ color: '#9aada8' }}>{description}</p>
    </div>
  );
}

// ── Timeline Item ────────────────────────────────────────────
function TimelineItem({ year, title, description }: { year: string; title: string; description: string }) {
  return (
    <div className="relative pl-8 pb-8 border-l-2 last:pb-0" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2" style={{ backgroundColor: '#050d0e', borderColor: '#c9a96e' }} />
      <span className="text-xs font-bold" style={{ color: '#c9a96e' }}>{year}</span>
      <h3 className="text-sm font-semibold mt-1" style={{ color: '#f0ebe0' }}>{title}</h3>
      <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9aada8' }}>{description}</p>
    </div>
  );
}

// ── Team Member ──────────────────────────────────────────────
function TeamMember({ name, role, initials }: { name: string; role: string; initials: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold" style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
        {initials}
      </div>
      <h4 className="text-sm font-semibold" style={{ color: '#f0ebe0' }}>{name}</h4>
      <p className="text-xs mt-0.5" style={{ color: '#5a7070' }}>{role}</p>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#c9a96e] blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#c9a96e] blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border" style={{ backgroundColor: 'rgba(201,169,110,0.08)', borderColor: 'rgba(201,169,110,0.2)', color: '#c9a96e' }}>
            <Gem className="w-3.5 h-3.5" />
            Our Story
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
            Crafting Elegance,{' '}
            <span style={{ color: '#c9a96e' }}>Perfecting Moments</span>
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: '#9aada8' }}>
            At Lumin, we believe jewelry is more than an accessory — it's a reflection of your unique story. 
            Every piece in our collection is thoughtfully curated to bring timeless elegance to Bangladesh.
          </p>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard value="10,000+" label="Happy Customers" />
            <StatCard value="2,500+" label="Products Curated" />
            <StatCard value="64" label="Districts Covered" />
            <StatCard value="98%" label="Satisfaction Rate" />
          </div>
        </div>
      </section>

      {/* ── Mission Section ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
                Our Mission
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#9aada8' }}>
                Lumin was born from a simple vision: to make premium jewelry accessible to every woman in Bangladesh. 
                We partner with skilled artisans and trusted manufacturers to bring you pieces that combine 
                traditional craftsmanship with modern design.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#9aada8' }}>
                From the bustling streets of Dhaka to the serene landscapes of Sylhet, we deliver elegance 
                to your doorstep. Every order is handled with care, ensuring that your shopping experience 
                is as beautiful as the jewelry itself.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(201,169,110,0.15)' }}>
              <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: 'rgba(201,169,110,0.05)' }}>
                <Gem className="w-20 h-20" style={{ color: 'rgba(201,169,110,0.2)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values Section ── */}
      <section className="py-12 md:py-16" style={{ backgroundColor: 'rgba(10,26,27,0.5)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
              What We Stand For
            </h2>
            <p className="text-sm" style={{ color: '#9aada8' }}>Our core values guide everything we do.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ValueCard icon={<Gem className="w-5 h-5" />} title="Quality First" description="Every product is hand-inspected to ensure it meets our rigorous quality standards before reaching you." />
            <ValueCard icon={<Shield className="w-5 h-5" />} title="Trust & Transparency" description="We believe in honest pricing, clear product descriptions, and no hidden charges — ever." />
            <ValueCard icon={<Truck className="w-5 h-5" />} title="Fast Delivery" description="Free shipping across Bangladesh with real-time order tracking and secure packaging." />
            <ValueCard icon={<Heart className="w-5 h-5" />} title="Customer First" description="Your satisfaction is our priority. Our support team is here to help you every step of the way." />
            <ValueCard icon={<RefreshCw className="w-5 h-5" />} title="Hassle-Free Returns" description="Not in love with your purchase? We offer easy returns and quick refunds within our policy period." />
            <ValueCard icon={<Leaf className="w-5 h-5" />} title="Ethical Sourcing" description="We partner with suppliers who share our commitment to ethical practices and sustainability." />
          </div>
        </div>
      </section>

      {/* ── Journey Timeline ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
              Our Journey
            </h2>
            <p className="text-sm" style={{ color: '#9aada8' }}>How we grew from an idea to Bangladesh's trusted jewelry destination.</p>
          </div>
          <div className="max-w-lg mx-auto">
            <TimelineItem year="2020" title="The Beginning" description="Lumin was founded with a vision to revolutionize online jewelry shopping in Bangladesh, starting with a curated collection of 50 pieces." />
            <TimelineItem year="2021" title="Growing Reach" description="Expanded our collection to over 500 products and started serving customers across all 64 districts of Bangladesh." />
            <TimelineItem year="2022" title="Trust & Recognition" description="Reached 5,000 happy customers milestone. Launched our loyalty program to reward our most cherished patrons." />
            <TimelineItem year="2023" title="Innovation & Excellence" description="Introduced exclusive designer collaborations and enhanced our quality assurance process with artisan partnerships." />
            <TimelineItem year="2024" title="Community & Beyond" description="Surpassed 10,000 customers. Launched community initiatives and continued to bring the finest jewelry to Bangladesh." />
          </div>
        </div>
      </section>

      {/* ── Team Section ── */}
      <section className="py-12 md:py-16" style={{ backgroundColor: 'rgba(10,26,27,0.5)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
              Meet the Team
            </h2>
            <p className="text-sm" style={{ color: '#9aada8' }}>Passionate people behind Lumin.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <TeamMember name="Ahmed Jishan" role="Founder & CEO" initials="AJ" />
            <TeamMember name="Fatima Begum" role="Head of Design" initials="FB" />
            <TeamMember name="Rafiq Hasan" role="Operations Lead" initials="RH" />
            <TeamMember name="Nusrat Jahan" role="Customer Care" initials="NJ" />
          </div>
        </div>
      </section>

      {/* ── Why Shop With Us ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border p-8 md:p-12 text-center" style={{ borderColor: 'rgba(201,169,110,0.15)', backgroundColor: 'rgba(10,26,27,0.5)' }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
              Why Shop With Lumin?
            </h2>
            <p className="text-sm leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: '#9aada8' }}>
              We're not just an online store — we're a promise of quality, trust, and exceptional service. 
              Every order is a relationship we cherish.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: <Truck className="w-5 h-5" />, label: 'Free Delivery' },
                { icon: <Shield className="w-5 h-5" />, label: 'Secure Payment' },
                { icon: <RefreshCw className="w-5 h-5" />, label: 'Easy Returns' },
                { icon: <HeadphonesIcon className="w-5 h-5" />, label: '24/7 Support' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,169,110,0.06)' }}>
                  <div style={{ color: '#c9a96e' }}>{item.icon}</div>
                  <span className="text-xs font-medium" style={{ color: '#f0ebe0' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t" style={{ borderColor: 'rgba(201,169,110,0.1)' }}>
              <p className="text-xs" style={{ color: '#5a7070' }}>
                Have questions? We'd love to hear from you.{' '}
                <a href="/contact" className="font-medium underline underline-offset-2" style={{ color: '#c9a96e' }}>Contact us</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}