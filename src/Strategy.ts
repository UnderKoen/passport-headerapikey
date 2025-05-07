/**
 *  Creator: Christian Hotz
 *  Company: hydra newmedia GmbH
 *  Date: 27.06.16
 *
 *  Copyright hydra newmedia GmbH
 */

/**
 *  Imports
 */
import * as _ from 'lodash';
import { Request } from 'express';
import { Strategy as PassportStrategy } from 'passport-strategy';
import { BadRequestError } from './errors/BadRequestError';

type verifiedCallback = (err: Error | null, user?: Object, info?: Object) => void;
type verifyCallback = ((apiKey: string, verified: verifiedCallback) => void) | ((apiKey: string, req: Request, verified: verifiedCallback) => void);

export class Strategy extends PassportStrategy {

    apiKeyHeader: { header: string, prefix: string };
    name: string;
    verify: verifyCallback;
    passReqToCallback: boolean;

    constructor(header: { header: string, prefix: string }, passReqToCallback: boolean,
                verify: verifyCallback) {
        super();
        this.apiKeyHeader = header || { header: 'X-Api-Key', prefix: '' };
        if (!this.apiKeyHeader.header) this.apiKeyHeader.header = 'X-Api-Key';
        if (!this.apiKeyHeader.prefix) this.apiKeyHeader.prefix = '';
        this.apiKeyHeader.header = this.apiKeyHeader.header.toLowerCase();

        this.name = 'headerapikey';
        this.verify = verify;
        this.passReqToCallback = passReqToCallback || false;
    }

    authenticate(req: Request, options?: Object): void {
        let apiKey: string = _.get(req.headers, this.apiKeyHeader.header) as string;
        if (!apiKey) {
            return this.fail(new BadRequestError('Missing API Key'), null);
        }

        if (_.startsWith(apiKey, this.apiKeyHeader.prefix)) {
            apiKey = apiKey.replace(new RegExp('^' + this.apiKeyHeader.prefix), '');
        } else {
            return this.fail(
                new BadRequestError(
                    'Invalid API Key prefix, ' + this.apiKeyHeader.header + ' header should start with "' + this.apiKeyHeader.prefix + '"'
                ),
                null
            );
        }

        let verified = (err: Error | null, user?: Object, info?: Object) => {
            if (err) {
                return this.error(err);
            }
            if (!user) {
                return this.fail(info, null);
            }
            this.success(user, info);
        };

        if (this.passReqToCallback) {
            // @ts-ignore should be called with a request
            this.verify(apiKey, req, verified);
        } else {
            // @ts-ignore should be called without a request
            this.verify(apiKey, verified);
        }
    }
}
