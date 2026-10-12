interface CommonBannerProps {
  title: string
  backgroundColor?: string
  textColor?: string
}

export default function CommonBanner({
  title,
  textColor = "text-default",
}: CommonBannerProps) {
  return (
    <section className={`py-16 lg:pb-[120px] lg:pt-56 bg-gradient-to-l from-[rgba(192,109,26,0.3)] to-[rgba(22,26,100,0.3)] `}>
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className={`text-3xl lg:text-4xl xl:text-[56px] font-bold ${textColor}`}>{title}</h1>
        </div>
      </div>
    </section>
  )
}
