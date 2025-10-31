"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EmailImageCombiner from "@/components/Editor/email-image-combiner";
import ImageToBase64 from "@/components/Editor/ImageToBase64";
import ImageMapEditor from "@/components/Editor/ImageMapEditor";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-10 bg-gray-50">
      <div className="w-full max-w-5xl p-6 bg-white shadow-lg rounded-2xl">
        <Tabs defaultValue="combine" className="w-full">
          {/* Tab Buttons */}
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="combine"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black"
            >
              🧩 Combine Images
            </TabsTrigger>
            <TabsTrigger
              value="base64"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black"
            >
              🔢 Image to Base64
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black"
            >
              🗺️ Image Map
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="combine" className="mt-6">
            <EmailImageCombiner />
          </TabsContent>

          <TabsContent value="base64" className="mt-6">
            <ImageToBase64 />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <ImageMapEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
