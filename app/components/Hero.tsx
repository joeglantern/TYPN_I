import Image from 'next/image'

<div className="relative mb-8 inline-block group">
  <Image
    src="/logo.png"
    alt="TYPNI Logo"
    width={160}
    height={160}
    className="transition-transform duration-500 group-hover:rotate-[360deg]"
  />
  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse" />
</div> 