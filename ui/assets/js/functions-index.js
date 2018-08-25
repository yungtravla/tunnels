
/* Set functions for index.html */

	// Sleep
	const sleep = async seconds => {
		return new Promise(async resolve=>{
			setTimeout(resolve, seconds * 1000)
		})
	}

	// Escape HTML
	const escapeHTML = async data => {
		return new String(data).replace(/\&/g, "&amp;").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/\"/g, "&quot;").replace(/\'/g,"&#39;").replace(/\//g, "&#x2F;").replace(/ /g, "&nbsp;").replace(/\t/g, "&emsp;").replace(/\n/g, "<br>")
	}

	// Log to console
	const log = async data => {
		console.log(data)
	}

	// Open terminal in new pop-up tab
	const openTerminal = async (relay, session_id) => {
		self.open('./terminal/' + relay + '/' + session_id, session_id +' - TAB' + Math.floor( (Math.random() * 9999) + 1), 'menubar=no,location=no,resizable=yes,scrollbars=no,status=yes')
	}

	// Fetch console log
	const fetchLog = async () => {
		sendRequest("GET", "/console_log", "").then(async res=>{
			if (res.status == 200) {
				let response = res.responseText.replace(/\n/g, "<br>")

				if (consoleContainer.innerHTML != response) {
					consoleContainer.innerHTML = response

					scrollOnOutput ? consoleContainer.scrollTop += 999999 : ""
				}
			} else {
				print("Could not connect to sewers.")
			}
		})
	}

	const getSewersConfig = async () => {
		return new Promise(async resolve=>{
			sendRequest("GET", "/config/sewers", "").then(async res=>{
				if (res.status == 200) {
					config = JSON.parse(res.responseText)
					resolve()
				} else {
					print("Could not fetch sewers config.")
					resolve()
				}
			})
		})
	}

	const getSewersUserAgent = async () => {
		let res = await sendRequest("GET", "/useragent", "")

		return res.responseText
	}

	const showRelays = async () => {
		let skeleton = `
			<div class="relaylist">
				<div class="header">
					<h1>Relays</h1>
					<span class="newsmessage">&nbsp;</span>
				</div>
				<div class="space"></div>
			</div>
		`

		container.classList.add("hide")
		container.classList.add("nopointerevents")

		sleep(0.4).then(()=>{
			container.innerHTML = skeleton

			sendRequest("GET", "/get_relays", "").then(async res=>{
				let response = res.responseText

				if (response != "nil") {
					let relays = JSON.parse(response)

					for (let i = 0; i < Object.keys(relays).length; i++) {
						let relay = document.createElement("div")

						relay.name = await escapeHTML(relays[i].RelayID)
						relay.className = "relay"
						relay.innerHTML = `
							<span class="relaynumber">RELAY ` + (i + 1) + `</span>
							<span class="name" title="Relay name">` + await escapeHTML(relays[i].RelayID) + `</span>
							<span class="url" title="Relay address">` + await escapeHTML(relays[i].RelayAddress) + `</span>
						`
						relay.onclick = async () => {
							showSessions(relays[i].RelayID)
						}

						document.querySelector("html body div.scrollcontainer div.container div.relaylist div.space").before(relay)
					}

					sleep(0.72).then(()=>{
						currentRelaysNews = 0

						cycleNews().then(async()=>{
							container.classList.remove("hide")
							container.classList.remove("nopointerevents")
						})
					})
				} else {
					let span = document.createElement("span")
					span.class = "nonefound"
					span.innerText = "No relays found"

					document.querySelector("html body div.scrollcontainer div.container div.relaylist div.space").before(span)

					currentRelaysNews = 0

					cycleNews().then(async()=>{
						container.classList.remove("hide")
						container.classList.remove("nopointerevents")
					})
				}
			})
		})

		relays = document.querySelectorAll("html body div.scrollcontainer div.container div.relaylist div.relay")
	}

	const showSessions = async relay => {
		container.classList.add("hide")
		container.classList.add("nopointerevents")

		sleep(0.4).then(async()=>{
			container.innerHTML = `
				<div class="sessionlist">
					<div class="header">
						<h1>` + await escapeHTML(relay) + `</h1>
						<span class="newsmessage">&nbsp;</span>
					</div>
					<div class="space"></div>
				</div>
			`

			backbutton.classList.remove("hidden")

			sendRequest("GET", "/relay/" + relay, "").then(async res=>{
				if (res.status == 200) {
					if ( res.responseText != "nil" && res.responseText.match(/([a-zA-Z]+)/) ) {
						let sessionlist = res.responseText.split(",")

						for (let i = 0; i < sessionlist.length; i++) {
							let url = "./session/" + relay.replace(".json", "") + "/" + sessionlist[i]

							sendRequest("GET", url, "").then(async res=>{
								if (res.status == 200) {
									let session = sessionlist[i]

									if (res.responseText != "nil") {
										sessionConfig = JSON.parse(res.responseText)
										device = ( sessionConfig.os.indexOf("Android" || "android") >= 0 ) 
											? "phone" 
											: ( sessionConfig.os.indexOf("Darwin" || "darwin") >= 0 ) 
											? "laptop"
											: ( sessionConfig.os.indexOf("cygwin" || "cygwin" || "mswin" || "mingw" || "bccwin" || "wince" || "emx") >= 0 ) 
											? "laptop" 
											: ( sessionConfig.device.indexOf("Acer Aspire") >= 0 ) 
											? "laptop" 
											: "unknown"
										logo = ( sessionConfig.device.indexOf("Acer") >= 0 ) 
											? "acer" 
											: ( sessionConfig.os.indexOf("Android" || "android") >= 0 ) 
											? "android" 
											: ( sessionConfig.os.indexOf("Darwin" || "darwin") >= 0 ) 
											? "apple" 
											: ( sessionConfig.os.indexOf("cygwin" || "cygwin" || "mswin" || "mingw" || "bccwin" || "wince" || "emx") >= 0 ) 
											? "windows" 
											: "unknown"

										let div = document.createElement("div")

										div.className = "session"
										div.innerHTML = `
											<div class="icon ` + await escapeHTML(device) + `">
												<div class="logo ` + await escapeHTML(logo) + `"></div>
											</div>
											<span class="device">` + await escapeHTML(sessionConfig.device) + `</span>
											<span class="id">` + await escapeHTML(session) + `</span>
											<span class="hostname">` + await escapeHTML(sessionConfig.hostname) + `</span>
										`
										div.onclick = async () => {
											openTerminal(relay, session)
										}

										document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(div)
									} else {
										let div = document.createElement("div")

										div.className = "session unknown"
										div.innerHTML = `
											<div class="icon unknown"></div>
											<span class="device">` + await escapeHTML(sessionConfig.device) + `</span>
											<span class="id">` + await escapeHTML(session) + `</span>
											<span class="hostname">undefined</span>
										`
										div.onclick = async () => {
											openTerminal(relay, session)
										}

										document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(div)
									}
								}
							})
						}
						// debug
						div = document.createElement("div")
						div.className = "session"
						div.innerHTML = `
							<div class="icon router">
								<div class="logo tplink"></div>
							</div>
							<span class="device">Tor Exit TP-Link TL-WR840N</span>
							<span class="id">aX302ioJjf0mk21</span>
							<span class="hostname">gateway</span>
						`
						document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(div)

						currentSessionsNews = 0
						cycleNews()

						container.classList.remove("hide")
						container.classList.remove("nopointerevents")
					} else {
						print(response)

						let span = document.createElement("span")
						let div = document.createElement("div")
						span.className = "nonefound"
						span.innerText = "No interpreters found"
						div.className = "space"

						document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(span)
						document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(div)

						currentSessionsNews = 0
						cycleNews()

						container.classList.remove("hide")
						container.classList.remove("nopointerevents")
					}
				} else {
					let span = document.createElement("span")
					span.className = "nonefound"
					span.innerText = "Unable to connect to relay"

					document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.space").before(span)

					currentSessionsNews = 0
					cycleNews()

					container.classList.remove("hide")
					container.classList.remove("nopointerevents")
				}
			})
		})

		sessions = document.querySelectorAll("html body div.scrollcontainer div.container div.sessionlist div.session")
	}

	// Override CSS
	const updateCSS = async () => {
		// Console resizing
		let newHeight = parseInt(config.console_height)

		webConsole.style.height = newHeight + "px"
		topbar.style.bottom = (newHeight - 1) + "px"
		scrollContainer.style.height = "calc(100% - " + newHeight + "px)"

		// Center message box
		let messageboxHeight = messageBox.getBoundingClientRect().height
		messageBox.style.marginTop = "-" + ( (messageboxHeight / 2) + 20 ) + "px"

		// Center modal
		let openModal = document.querySelector("html body div.fade div.modal.open")
		let openOptions = document.querySelector("html body div.fade div.modal.open div.optionbox ul")
		if (openModal) {
			openModal.css( "min-height", "calc(" + openOptions.getBoundingClientRect().height + "px + 44px)" )
			modalHeight = openModal.getBoundingClientRect().height
			openModal.css( "margin-top", "-" + ( (modalHeight / 2) + 20 ) + "px" )
		}
	}

	// Print to console
	const print = async string => {
		consoleContainer.append(string)
	}

	// Show message box
	const showMessage = async (title, message) => {
		messageTitle.innerText = title
		messageBody.innerHTML = message

		fade.classList.remove("hide")

		sleep(0.2).then(async()=>{
			messageBox.classList.remove("down")

			updateCSS()
		})
	}

	// Close message box
	const hideMessage = async () => {
		messageBox.classList.add("up")

		setTimeout(async()=>{
			fade.classList.add("hide")

			setTimeout(async()=>{
				messageBox.classList.add("down")
				messageBox.classList.remove("up")
			}, 360)
		}, 180)
	}

	// Show modal
	const showPreferences = async () => {
		try {
			document.querySelector("html body div.fade div.modal.settings").classList.add("open")

			let openModal = document.querySelector("html body div.fade div.modal.open")

			fade.classList.remove("hide")

			setTimeout(async()=>{
				openModal.classList.remove("down")
				updateCSS()
			}, 180)
		} catch (ignore){}
	}

	// Hide modal
	const hideMenu = async () => {
		openModal.classList.add("up")

		setTimeout(async()=>{
			fade.classList.add("hide")

			setTimeout(async()=>{
				openModal.classList.remove("up")
				openModal.classList.add("down")
				modales.classList.remove("open")
			}, 360)
		}, 180)
	}

	// Cycle news messages
	const cycleNews = async () => {
		// Update vars
		let newsMessage = document.querySelector("html body div.scrollcontainer div.container div div.header span.newsmessage")
		let relayNewsMessage = document.querySelector("html body div.scrollcontainer div.container div.relaylist div.header span.newsmessage")
		let SessionsNewsMessage = document.querySelector("html body div.scrollcontainer div.container div.sessionlist div.header span.newsmessage")

		// Cycle
		newsRelays = {
			0: relays.length + " relay" + (relays.length > 1 || relays.length < 1 ? "s" : ""),
			1: "User-Agent: <span style=\"font-weight:bold\">" + await escapeHTML( await getSewersUserAgent() ) + "</span>",
		},
		newsSessions = {
			0: sessions.length + " session" + (sessions.length > 1 || sessions.length < 1 ? "s" : ""),
			1: "User-Agent: <span style=\"font-weight:bold\">" + await escapeHTML( await getSewersUserAgent() ) + "</span>",
		}

		newsMessage.classList.add('hide')

		if ( currentRelaysNews == Object.keys(newsRelays).length ) {
			currentRelaysNews = 0
		}
		if ( currentSessionsNews == Object.keys(newsSessions).length ) {
			currentSessionsNews = 0
		}

		setTimeout(async()=>{
			if (relayNewsMessage) {
				relayNewsMessage.innerHTML = newsRelays[currentRelaysNews]
				relayNewsMessage.classList.remove("hide")
				currentRelaysNews += 1
			}
			if (SessionsNewsMessage) {
				SessionsNewsMessage.innerHTML = newsSessions[currentSessionsNews]
				SessionsNewsMessage.classList.remove("hide")
				currentSessionsNews += 1
			}
		}, 360)
	}

	// Close sewers
	const quit = async () => {
		location = "/quit"
	}
