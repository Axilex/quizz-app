import type { Question } from '@/types';

import textQuestions from './questions_text.json';
import numberQuestions from './questions_number.json';
import qcmQuestions from './questions_qcm.json';
import rebusQuestions from './questions_rebus.json';
import fourImagesQuestions from './questions_four_images.json';
import chronologyQuestions from './questions_chronology.json';
import blindTestQuestions from './questions_blind_test.json';
import geoQuestions from './questions_geo.json';
import intruderQuestions from './questions_intruder.json';
import silhouetteQuestions from './questions_silhouette.json';

export const allQuestions: Question[] = [
  ...(textQuestions as Question[]),
  ...(numberQuestions as Question[]),
  ...(qcmQuestions as Question[]),
  ...(rebusQuestions as Question[]),
  ...(fourImagesQuestions as Question[]),
  ...(chronologyQuestions as Question[]),
  ...(blindTestQuestions as Question[]),
  ...(geoQuestions as Question[]),
  ...(intruderQuestions as Question[]),
  ...(silhouetteQuestions as Question[]),
];

export const questionsByType = {
  text: textQuestions as Question[],
  number: numberQuestions as Question[],
  qcm: qcmQuestions as Question[],
  rebus: rebusQuestions as Question[],
  fourImages: fourImagesQuestions as Question[],
  chronology: chronologyQuestions as Question[],
  blindTest: blindTestQuestions as Question[],
  geoMap: geoQuestions as Question[],
  intruder: intruderQuestions as Question[],
  silhouette: silhouetteQuestions as Question[],
};
