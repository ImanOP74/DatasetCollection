export interface Participant {
  id: string;
  participant_code: string;
  name: string;
  environment: string;
  device_type: string;
  consent: boolean;
  created_at: string;
}

export interface Recording {
  id: string;
  participant_id: string;
  phrase: string;
  audio_url: string;
  duration: number;
  file_format: string;
  created_at: string;
}

export interface ParticipantWithRecordings extends Participant {
  recordings: Recording[];
}

export interface RecordingWithParticipant extends Recording {
  participant: {
    participant_code: string;
    name: string;
    environment: string;
    device_type: string;
  };
}

export type DeviceType = 'Phone' | 'Laptop' | 'Headset' | 'External Microphone';

export type EnvironmentType = 'Quiet Room' | 'Fan Running' | 'TV Background' | 'Outside' | 'Classroom / Office' | 'Other';

export interface Phrase {
  text: string;
  type: 'positive' | 'negative';
  id: string;
}
