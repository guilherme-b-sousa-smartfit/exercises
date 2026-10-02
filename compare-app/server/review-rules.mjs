export const MISSING_VIDEO_MESSAGE='Para validar, o exercício precisa ter o vídeo GymVisual ou um vídeo substituto.';
export const hasReviewVideo=(gymVideo,replacementVideo)=>!!(gymVideo.trim()||replacementVideo.trim());
