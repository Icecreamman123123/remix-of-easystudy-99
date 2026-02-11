import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUp, File, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lovableChatCompletion } from "@/lib/lovable-ai";

interface FileDropzoneProps {
  onTextExtracted: (text: string, fileName: string) => void;
}

export function FileDropzone({ onTextExtracted }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    
    const arrayBuffer = await file.arrayBuffer();
    
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`
    }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = (textContent as unknown as { items?: unknown[] }).items || [];
      const pageText = items
        .map((item) => {
          const rec = (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null);
          return typeof rec?.str === "string" ? rec.str : "";
        })
        .filter(Boolean)
        .join(" ");
      fullText += pageText + '\n\n';
      setProgress(Math.round((i / totalPages) * 100));
    }
    
    return fullText.trim();
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    setProgress(10);
    
    // Convert to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.readAsDataURL(file);
    });
    
    setProgress(30);
    
    const text = await lovableChatCompletion(
      [
        {
          role: "system",
          content:
            "Extract all readable text from the provided image. Return ONLY the extracted text, no markdown, no commentary.",
        },
        {
          role: "user",
          content: `mimeType: ${file.type}\nbase64: ${base64}`,
        },
      ],
      { model: "google/gemini-2.5-flash", temperature: 0.1, maxTokens: 2048 }
    );
    
    setProgress(90);
    
    setProgress(100);
    return text || "";
  };

  const handleFile = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setFileType(isPdf ? "pdf" : "image");
    setIsProcessing(true);
    setProgress(0);

    try {
      let text: string;
      
      if (isPdf) {
        text = await extractTextFromPdf(file);
      } else {
        text = await extractTextFromImage(file);
      }
      
      if (!text || text.length < 20) {
        toast({
          title: "Could not extract text",
          description: isPdf 
            ? "The PDF appears to be image-based or empty. Try uploading the image directly."
            : "Could not read text from this image. Try a clearer image.",
          variant: "destructive",
        });
        setIsProcessing(false);
        setFileName(null);
        setFileType(null);
        return;
      }

      onTextExtracted(text, file.name);
      toast({
        title: "File processed",
        description: `Extracted ${text.length} characters from ${file.name}`,
      });
    } catch (error) {
      console.error('File extraction error:', error);
      toast({
        title: "Failed to process file",
        description: error instanceof Error ? error.message : "There was an error reading the file.",
        variant: "destructive",
      });
      setFileName(null);
      setFileType(null);
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearFile = () => {
    setFileName(null);
    setFileType(null);
    setProgress(0);
  };

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardContent className="p-4">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Processing {fileName}</p>
              <p className="text-xs text-muted-foreground">
                {fileType === "image" ? "Extracting text from image..." : "Extracting text..."}
              </p>
            </div>
            <Progress value={progress} className="w-full max-w-xs" />
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {fileType === "image" ? (
                <ImageIcon className="h-5 w-5 text-primary" />
              ) : (
                <File className="h-5 w-5 text-primary" />
              )}
              <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 py-4 cursor-pointer">
            <div className="flex items-center gap-2">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Drop file here or click to upload</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG • Max 20MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf,image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
