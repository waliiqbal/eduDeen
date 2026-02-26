// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-google-oauth20';
// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//     constructor() {
//         super({
//             clientID: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: '/api/auth/google/callback',
//             scope: ['email', 'profile'],
//         });
//     }

//     async validate(_, __, profile) {
//         return {
//             email: profile.emails[0].value,
//             name: profile.displayName,
//             googleId: profile.id,
//         };
//     }
// }
