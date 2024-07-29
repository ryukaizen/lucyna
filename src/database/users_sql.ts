import { prisma } from "./index";

export async function get_users_count() {
    let users = await prisma.users.count();
    return users;
};

export async function get_user(id: bigint) {
    let user = await prisma.users.findUnique({
        where: {
            user_id: id,
        }
    });
    return user;
};

export async function get_all_users() {
    let users = await prisma.users.findMany();
    return users;
}

export async function register_user(id: bigint, username: string) {
    try {
        let user = await prisma.users.upsert({
            where: {
                user_id: id,
            },
            update: {
                username: username,
            },
            create: {
                user_id: id,
                username: username,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
};