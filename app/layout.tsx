import type { Metadata } from "next";
import "./framer/framer.css";
import "./framer/custom.css";
import Interactions from "@/components/framer/Interactions";

export const metadata: Metadata = {
  title: 'Tradeo – Life-Changing Crypto Banking Platform Powered by AI',
  description:
    "Buy, sell, and trade crypto with confidence on Tradeo's AI-powered banking platform. Enjoy an intuitive trading interface, secure transactions, instant account setup, and real-time market analytics.",
  icons: { icon: "/assets/images/eh28cGz2uznSl7swilcHtLcho.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="main" data-framer-generated-page>
          {children}
        </div>
        <Interactions />
      </body>
    </html>
  );
}
