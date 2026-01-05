import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";

export function setupAuth(app: Express) {
    const MemoryStore = createMemoryStore(session);
    const sessionSettings: session.SessionOptions = {
        secret: "super-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {},
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1);
        sessionSettings.cookie = {
            secure: true,
        };
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            const user = await storage.getUserByUsername(username);
            if (!user || user.password !== password) {
                return done(null, false, { message: "Invalid username or password" });
            } else {
                return done(null, user);
            }
        }),
    );

    passport.serializeUser((user, done) => {
        done(null, (user as User).id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    app.post("/api/login", (req, res, next) => {
        passport.authenticate("local", (err: any, user: User, info: any) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            req.login(user, (err) => {
                if (err) {
                    return next(err);
                }
                res.status(200).json(user);
            });
        })(req, res, next);
    });

    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            res.sendStatus(200);
        });
    });

    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(401);
        }
        res.json(req.user);
    });
}
