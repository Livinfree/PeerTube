import { forkJoin, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Resolve } from '@angular/router'
import { VideoCaptionService, VideoChannelService, VideoDetails, VideoLiveService, VideoService } from '@app/shared/shared-main'

@Injectable()
export class VideoUpdateResolver implements Resolve<any> {
  constructor (
    private videoService: VideoService,
    private videoLiveService: VideoLiveService,
    private videoChannelService: VideoChannelService,
    private videoCaptionService: VideoCaptionService
  ) {
  }

  resolve (route: ActivatedRouteSnapshot) {
    const uuid: string = route.params[ 'uuid' ]

    return this.videoService.getVideo({ videoId: uuid })
               .pipe(
                 switchMap(video => forkJoin(this.buildVideoObservables(video))),
                 map(([ video, videoChannels, videoCaptions, videoLive ]) => ({ video, videoChannels, videoCaptions, videoLive }))
               )
  }

  private buildVideoObservables (video: VideoDetails) {
    return [
      this.videoService
        .loadCompleteDescription(video.descriptionPath)
        .pipe(map(description => Object.assign(video, { description }))),

      this.videoChannelService
        .listAccountVideoChannels(video.account)
        .pipe(
          map(result => result.data),
          map(videoChannels => videoChannels.map(c => ({
            id: c.id,
            label: c.displayName,
            support: c.support,
            avatarPath: c.avatar?.path
          })))
        ),

      this.videoCaptionService
        .listCaptions(video.id)
        .pipe(
          map(result => result.data)
        ),

      video.isLive
          ? this.videoLiveService.getVideoLive(video.id)
          : of(undefined)
    ]
  }
}
