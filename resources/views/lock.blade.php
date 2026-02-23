<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>App Locked</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: "Segoe UI", sans-serif;
            background: radial-gradient(900px circle at 80% -20%, #fff8ee 0%, transparent 58%),
                        linear-gradient(180deg, #f8f4ec 0%, #f3eee4 100%);
            color: #2f2a24;
        }
        .card {
            width: min(92vw, 420px);
            background: #fffdf9;
            border: 1px solid #dacdbb;
            border-radius: 10px;
            box-shadow: 0 14px 28px rgba(41, 30, 15, 0.12);
            padding: 1rem;
        }
        h1 { margin: 0 0 0.6rem; font-size: 1.2rem; }
        p { margin: 0 0 0.9rem; color: #6f6559; }
        label { display: block; font-weight: 600; margin-bottom: 0.35rem; }
        input {
            width: 100%;
            box-sizing: border-box;
            padding: 0.55rem;
            border: 1px solid #dacdbb;
            border-radius: 8px;
            margin-bottom: 0.7rem;
        }
        button {
            width: 100%;
            border: 1px solid #296252;
            border-radius: 8px;
            padding: 0.55rem;
            color: #fff;
            font-weight: 700;
            cursor: pointer;
            background: linear-gradient(180deg, #3a806e, #2f6d5d);
        }
        .error {
            color: #8a1f1a;
            background: #fdecea;
            border: 1px solid #f3c5c1;
            border-radius: 8px;
            padding: 0.45rem 0.55rem;
            margin-bottom: 0.7rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>This app is password protected</h1>
        <p>Enter the access password to continue.</p>

        @if($errors->has('password'))
            <div class="error">{{ $errors->first('password') }}</div>
        @endif

        <form method="post" action="{{ route('lock.unlock') }}">
            @csrf
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
            <button type="submit">Unlock App</button>
        </form>
    </div>
</body>
</html>
