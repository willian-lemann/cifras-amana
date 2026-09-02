import Image from "next/image";

type LogoProps = {
  width?: number;
  height?: number;
};
export function Logo({ width = 18, height = 18 }: LogoProps) {
  return <Image src="/logo.png" alt="Logo" width={width} height={height} />;
}
