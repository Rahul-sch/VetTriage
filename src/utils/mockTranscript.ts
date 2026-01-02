import type { TranscriptSegment } from "../types/transcript";

/**
 * Returns a mock transcript for demo and debugging purposes.
 *
 * Scenario:
 * - Patient: Buddy, Golden Retriever, 5 years old, 75 lbs, neutered male
 * - Owner: Sarah Johnson
 * - Chief complaint: lethargy and vomiting for 2 days
 * - Symptoms: vomiting, lethargy, diarrhea, loss of appetite
 * - Medical history: ear infection 6 months ago
 * - Medications: none
 * - Notes: ate something from the trash yesterday
 * - Assessment: possible gastroenteritis, rule out foreign body
 * - Urgency: moderate (level 3)
 */
export function getMockTranscript(): TranscriptSegment[] {
  const baseTime = Date.now();

  return [
    {
      speaker: "vet",
      text: "Good morning, how can I help you and Buddy today?",
      timestamp: baseTime,
    },
    {
      speaker: "owner",
      text: "Hi, I'm Sarah Johnson. Buddy has been really lethargic and vomiting for the past two days. I'm very worried about him.",
      timestamp: baseTime + 4000,
    },
    {
      speaker: "vet",
      text: "I'm sorry to hear that. Can you tell me more about the vomiting? How often is it happening and what does it look like?",
      timestamp: baseTime + 9000,
    },
    {
      speaker: "owner",
      text: "He's been vomiting about three to four times a day. It started with food but now it's mostly yellow bile. He also has diarrhea and won't eat anything.",
      timestamp: baseTime + 14000,
    },
    {
      speaker: "vet",
      text: "Is he drinking water? Any changes in behavior besides the lethargy?",
      timestamp: baseTime + 20000,
    },
    {
      speaker: "owner",
      text: "He's drinking a little bit but not much. He's just lying around all day, which is not like him at all. He's usually so energetic.",
      timestamp: baseTime + 25000,
    },
    {
      speaker: "vet",
      text: "Did anything unusual happen recently? Any dietary changes or did he get into anything he shouldn't have?",
      timestamp: baseTime + 30000,
    },
    {
      speaker: "owner",
      text: "Actually yes, I caught him eating something from the trash yesterday. I'm not sure exactly what it was, maybe some old food scraps.",
      timestamp: baseTime + 35000,
    },
    {
      speaker: "vet",
      text: "That's helpful information. Can you tell me about Buddy's basic info? Age, weight, and is he neutered?",
      timestamp: baseTime + 40000,
    },
    {
      speaker: "owner",
      text: "He's a Golden Retriever, five years old, about 75 pounds, and yes he's neutered.",
      timestamp: baseTime + 44000,
    },
    {
      speaker: "vet",
      text: "Does Buddy have any medical history or is he on any medications?",
      timestamp: baseTime + 48000,
    },
    {
      speaker: "owner",
      text: "He had an ear infection about six months ago, but other than that he's been healthy. He's not on any medications currently.",
      timestamp: baseTime + 53000,
    },
    {
      speaker: "vet",
      text: "Okay. And can I get your contact information in case we need to reach you?",
      timestamp: baseTime + 57000,
    },
    {
      speaker: "owner",
      text: "Sure, my phone is 555-123-4567 and my email is sarah.johnson@email.com.",
      timestamp: baseTime + 61000,
    },
    {
      speaker: "vet",
      text: "Thank you. Based on what you've described, this sounds like it could be gastroenteritis from getting into the trash. We should also rule out a foreign body obstruction given the persistent vomiting. I'd like to examine Buddy and possibly run some tests.",
      timestamp: baseTime + 65000,
    },
  ];
}
