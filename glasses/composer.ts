import {
  CreateStartUpPageContainer,
  RebuildPageContainer,
  ImageContainerProperty,
  TextContainerProperty,
} from '@evenrealities/even_hub_sdk';
import { MAIN_SLOT, dummySlot } from './layout';

function imageContainer(): ImageContainerProperty {
  return new ImageContainerProperty({
    containerID: MAIN_SLOT.id,
    containerName: MAIN_SLOT.name,
    xPosition: MAIN_SLOT.x,
    yPosition: MAIN_SLOT.y,
    width: MAIN_SLOT.w,
    height: MAIN_SLOT.h,
  });
}

function eventCaptureContainer(): TextContainerProperty {
  return new TextContainerProperty({
    containerID: 2,
    containerName: 'events',
    xPosition: MAIN_SLOT.x,
    yPosition: MAIN_SLOT.y,
    width: MAIN_SLOT.w,
    height: MAIN_SLOT.h,
    borderWidth: 0,
    borderColor: 0,
    borderRadius: 0,
    paddingLength: 0,
    content: '',
    isEventCapture: 1,
  });
}

function dummy(): TextContainerProperty {
  const s = dummySlot(2);
  return new TextContainerProperty({
    containerID: s.id,
    containerName: s.name,
    xPosition: s.x,
    yPosition: s.y,
    width: s.w,
    height: s.h,
    borderWidth: 0,
    borderColor: 0,
    borderRadius: 0,
    paddingLength: 0,
    content: '',
    isEventCapture: 0,
  });
}

export function composeStartupPage(): CreateStartUpPageContainer {
  return new CreateStartUpPageContainer({
    containerTotalNum: 3,
    imageObject: [imageContainer()],
    textObject: [eventCaptureContainer(), dummy()],
  });
}

export function composeRebuildPage(): RebuildPageContainer {
  return new RebuildPageContainer({
    containerTotalNum: 3,
    imageObject: [imageContainer()],
    textObject: [eventCaptureContainer(), dummy()],
  });
}
