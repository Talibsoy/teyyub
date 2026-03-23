import Link from "next/link";

const team = [
  { name: "Nicat Məmmədov", role: "Baş Direktor", emoji: "👨‍💼" },
  { name: "Aytən Hüseynova", role: "Tur Meneceri", emoji: "👩‍💼" },
  { name: "Rauf Əliyev", role: "Müştəri Xidmətləri", emoji: "👨‍💼" },
  { name: "Günel Qasımova", role: "Viza Mütəxəssisi", emoji: "👩‍💼" },
];

const milestones = [
  { year: "2018", text: "FlyNaToure Bakıda quruldu" },
  { year: "2019", text: "Türkiyə turları istiqaməti açıldı" },
  { year: "2020", text: "Çətin dövrdə müştərilərimizə dəstək verdik" },
  { year: "2021", text: "Ərəb ölkələri istiqaməti əlavə edildi" },
  { year: "2022", text: "1000+ məmnun turist hədəfinə çatdıq" },
  { year: "2023", text: "Avropa turları proqramı başladıldı" },
  { year: "2024", text: "5000+ turistə xidmət göstərdik" },
];

export default function HaqqimızdaPage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0057A8] to-[#004a90] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Haqqımızda</h1>
        <p className="text-blue-200 max-w-xl mx-auto">Bakıdan dünyaya — etibarlı turizm tərəfdaşınız</p>
      </div>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-6">Bizim Hekayəmiz</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              FlyNaToure 2018-ci ildə Bakıda, turizm həvəskarları tərəfindən qurulmuşdur. Şirkətimizin əsas məqsədi
              Azərbaycan sakinlərinə yüksək keyfiyyətli, sərfəli və etibarlı tur xidmətləri göstərməkdir.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Türkiyə, Ərəb ölkələri (BƏƏ, Misir, Səudiyyə Ərəbistanı) və Avropa (Fransa, İtaliya, İspaniya, Çexiya
              və s.) istiqamətlərində geniş tur paketi portfelinə sahibik.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Hər ilin 5000-dən artıq turistinə xidmət göstərən komandamız, müştəri məmnuniyyətini hər şeydən üstün tutur.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#0057A8] to-[#009B77] rounded-2xl p-8 text-white">
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: "2018", label: "Quruluş ili" },
                { num: "70+", label: "Aktiv tur" },
                { num: "5000+", label: "Turist/il" },
                { num: "3", label: "İstiqamət" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-[#D4AF37]">{s.num}</div>
                  <div className="text-sm text-blue-200 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a1a2e] text-center mb-12">Tariximiz</h2>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-[#0057A8] font-bold text-sm">{m.year}</span>
                </div>
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-[#0057A8] mt-1 ring-4 ring-[#0057A8]/20" />
                <p className="text-gray-600 text-sm leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#1a1a2e] text-center mb-12">Komandamız</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member) => (
            <div key={member.name} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-[#0057A8]/30 hover:shadow-md transition-all">
              <div className="text-5xl mb-4">{member.emoji}</div>
              <h3 className="font-bold text-[#1a1a2e] text-sm">{member.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#1a1a2e] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Dəyərlərimiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "🤝", title: "Etibar", desc: "Müştərilərimizlə şəffaf və dürüst münasibətlər qururuq. Verdiyimiz sözü tutururuq." },
              { icon: "⭐", title: "Keyfiyyət", desc: "Hər tur paketini ən yüksək standartlara uyğun hazırlayırıq. Keyfiyyətsizlik qəbul edilmir." },
              { icon: "❤️", title: "Müştəri Məmnuniyyəti", desc: "Sizin məmnuniyyətiniz bizim uğurumuzun ölçüsüdür. Hər müştəriyə fərdi yanaşırıq." },
            ].map((v) => (
              <div key={v.title} className="text-center">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-[#D4AF37] mb-3">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">Bizimlə Səyahətə Çıxın</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Suallarınız varsa, əlaqə saxlayın. Komandamız sizin üçün ən yaxşı turu seçməkdən məmnun olar.</p>
        <Link href="/elaqe" className="inline-block bg-[#0057A8] text-white font-bold px-8 py-3 rounded-full hover:bg-[#004a90] transition-colors">
          Əlaqə Saxla
        </Link>
      </section>
    </div>
  );
}
