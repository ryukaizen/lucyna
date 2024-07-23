import admin from './admin';
import anime from "./anime";
import antiflood from './antiflood';
import bans from './bans';
import blacklists from './blacklists'
import extras from './extras';
import cleanbluetext from './cleanbluetext';
import cleanservice from './cleanservice'
import filters from './filters';
import locks from './locks';
import misc from './misc';
import mutes from './mutes';
import notes from './notes';
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
    anime,
    antiflood,
    bans,
    blacklists,
    extras,
    filters,
    locks,
    misc,
    mutes,
    notes,
    purges,
    reports,
    rules,
    start,
    test,
    users,
    warns,
    welcome,
// keep these at the very bottom to avoid conflicts with other modules (TODO: handle reply_parameters exception (400: Bad Request) when there is no message to reply)
    cleanservice,
    cleanbluetext, 
);

export default composer;