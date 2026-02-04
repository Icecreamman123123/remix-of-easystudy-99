import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeckSharing } from "@/hooks/useDeckSharing";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Loader2, Share2, Link } from "lucide-react";

interface ShareDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  deckTitle: string;
}

export function ShareDeckDialog({
  open,
  onOpenChange,
  deckId,
  deckTitle,
}: ShareDeckDialogProps) {
  const { createShareLink, loading } = useDeckSharing();
  const { toast } = useToast();
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    const code = await createShareLink(deckId);
    if (code) {
      setShareCode(code);
    } else {
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareUrl = shareCode
    ? `${window.location.origin}/shared/${shareCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareCode(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Deck
          </DialogTitle>
          <DialogDescription>
            Share "{deckTitle}" with other students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareCode ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Link className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Create a shareable link that anyone can use to copy this deck
                  to their account.
                </p>
              </div>
              <Button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full transition-all duration-200 hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Generate Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0 transition-all duration-200"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary animate-in zoom-in-50" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can copy the deck to their account.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
