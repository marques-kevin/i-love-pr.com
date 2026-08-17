type IlovePrLogoProps = {
  className?: string
}

export function IlovePrLogo({ className }: IlovePrLogoProps) {
  return <img src="/logo.svg" alt="iLovePR" width={78} height={100} className={className} />
}
