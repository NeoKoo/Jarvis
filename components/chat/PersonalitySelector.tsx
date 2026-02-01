'use client';

import { usePersonalityStore } from '@/stores/personality-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAllPersonalities } from '@/lib/ai/personalities';
import { AIPersonality } from '@/types';

export function PersonalitySelector() {
  const { currentPersonality, setPersonality } = usePersonalityStore();
  const personalities = getAllPersonalities();

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold mb-1">AI人格模式</h3>
          <p className="text-xs text-muted-foreground">
            选择AI的对话风格，让交流更有趣
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {personalities.map((personality) => (
            <Button
              key={personality.id}
              variant={currentPersonality === personality.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPersonality(personality.id as AIPersonality)}
              className="h-auto flex-col items-start p-3"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xl">{personality.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{personality.name}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {personality.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
