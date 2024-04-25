import admin from './admin';
import bans from './bans';
import misc from './misc';
import mutes from './mutes';
import purges from './purges';
import reports from './reports';
import rules from './rules';
import start from './start';
import test from './test';
import users from './users';
import warns from './warns';
import welcome from './welcome';

import { Composer } from "grammy";

const composer = new Composer();

composer.use(
    admin,
    bans,
    misc,
    mutes,
    purges,
    reports,
    rules,
    start,
    test,
    users,
    warns,
    welcome
);

export default composer;