# Dash docset for homebridge.io

Auto-generated from the docs that are available at https://developers.homebridge.io/

![screenshot](./screenshot.png)

## Download

Download from the "User Contributed" section from within dash

-- OR -- 

Alternatively download the [latest docset](https://github.com/dvcrn/dash-docset-homebridge/releases/latest) from Releases section from this repo. 

**Note:** If possible, download it from within Dash so it'll stay up-to-date when new releases are pushed. Installing it manually means you won't get updates

## Building yourself

For building the docset, you need to have [dashing](https://github.com/technosophos/dashing) installed.

For actually downloading and building the docset:

```
npm run download-docs
npm run generate-docset
```

## Notes

There is probably a smarter way of doing this by just using services.json + characteristics.json that the website itself uses for generation.
