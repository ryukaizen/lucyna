import admin from './admin';
import antiflood from './antiflood';
import bans from './bans';
import blacklists from './blacklists'
import filters from './filters';
import locks from './locks';
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
    antiflood,
    bans,
    blacklists,
    filters,
    locks,
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