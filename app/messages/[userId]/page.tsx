import { DirectMessageView } from "@/components/messages";

type MessagePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function MessagePage({ params }: MessagePageProps) {
  const { userId } = await params;
  return <DirectMessageView recipientId={userId} />;
}
