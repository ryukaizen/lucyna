import admin from './admin';
import afk from './afk';
import anilist from "./anilist";
import antiflood from './antiflood';
import antispam from './antispam';
import bans from './bans';
import blacklists from './blacklists'
import devtools from './devtools'
import disabling from './disabling';
import extras from './extras';
import cleanbluetext from './cleanbluetext';
import cleanservice from './cleanservice'
import connection from './connection';
import fbans from './fbans';
import filters from './filters';
import fun from './fun';
import gbans from './gbans';
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
import zombies from './zombies';

import { Composer } from "grammy";

const composer = new Composer();

composer.use(
    admin,
    afk,
    anilist,
    antiflood,
    antispam,
    bans,
    blacklists,
    connection,
    devtools,
    disabling,
    extras,
    fbans,
    filters,
    fun,
    gbans,
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
    zombies,
// keep these at the very bottom to avoid conflicts with other modules (TODO: handle reply_parameters exception (400: Bad Request) when there is no message to reply)
    cleanservice,
    cleanbluetext, 
);

export default composer;